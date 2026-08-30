"""Mutation tests for the Atlas publish gates (red-team 2026-08-29, Move 2).

Every test breaks the artifact ON PURPOSE and asserts the gate catches it — an
assertion count is not evidence (feedback_measure_the_gate_with_mutations). The
historical defects each test pins are named inline; do not delete a case without
checking its incident.

Stdlib only — CI runs:  python3 -m unittest discover -s scripts/tests
"""
import hashlib
import importlib.util
import io
import json
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("sac", SCRIPTS / "sync-atlas-content.py")
sac = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sac)

LEAKED_KEYS_2026_08_29 = [
    # The four keys that shipped to the live site while --verify-only said clean.
    "high_dose_update_ws13_S94",
    "ws13_ceiling_note",
    "ws13_review_framing_S94",
    "glp1_indication_expansion_ws13_S94",
]
RENAMED_KEYS = [
    # Their sanctioned replacements — these MUST ship (they carry clinical content).
    "high_dose_update_2026_06",
    "ceiling_note",
    "review_framing_2026_06",
    "glp1_indication_expansion_2026_06",
]


class TokenRegexes(unittest.TestCase):
    def test_value_regex_matches_underscore_suffix(self):
        # \bWS\d+\b never matched 'ws13_' because '_' is a word character — the exact
        # shape of the 2026-08-29 leak's cross-reference value.
        for s in ("ws13_review_framing", "see WS13_S94 note", "WS12 KB event 692"):
            self.assertTrue(sac._INTERNAL_TOKEN_RE.search(s), s)

    def test_key_regex_catches_all_four_leaked_keys(self):
        for k in LEAKED_KEYS_2026_08_29:
            self.assertTrue(sac._INTERNAL_KEY_RE.search(k), k)

    def test_key_regex_spares_legitimate_keys(self):
        for k in RENAMED_KEYS + ["phase3_ws", "dose_s_1", "pbm_coverage_glp1_us_2026",
                                 "approved_therapies_novel", "wsi_note"]:
            self.assertFalse(sac._INTERNAL_KEY_RE.search(k), k)


class InternalTokenGate(unittest.TestCase):
    PROBE = {
        "ws13_ceiling_note": "clean value",
        "nested": [{"high_dose_update_ws13_S94": {"dose": "7.2 mg"}}],
        "ok": {"note": "see WS13_review", "clean": "ORR 45%"},
    }

    def test_residue_walks_keys_and_values(self):
        n, found = sac.internal_token_residue(self.PROBE, "t")
        paths = [p for p, _ in found]
        self.assertIn("t.ws13_ceiling_note", paths)                       # key hit
        self.assertIn("t.nested[0].high_dose_update_ws13_S94", paths)     # nested key hit
        self.assertTrue(any(p == "t.ok.note" for p in paths))             # value hit
        self.assertGreater(n, 5)  # keys count toward the denominator

    def test_gate_aborts_on_findings(self):
        n, found = sac.internal_token_residue(self.PROBE, "t")
        with self.assertRaises(sac.SyncAborted):
            with redirect_stdout(io.StringIO()):
                sac.internal_token_gate(n, found, 1)

    def test_gate_ungateable_on_zero_examined(self):
        # Examined-nothing must NEVER reuse the pass path (three states, not two).
        with self.assertRaises(sac.SyncAborted):
            with redirect_stdout(io.StringIO()):
                sac.internal_token_gate(0, [], 6)

    def test_gate_clean_passes(self):
        n, found = sac.internal_token_residue({"a": {"b": "ORR 45%"}}, "t")
        self.assertEqual(found, [])
        with redirect_stdout(io.StringIO()):
            sac.internal_token_gate(n, found, 1)  # must not raise


class StripKeys(unittest.TestCase):
    def setUp(self):
        cfg = json.loads((SCRIPTS / "atlas-redaction-config.json").read_text())
        self.strip = set(cfg["etlm_strip_keys"])
        self.patterns = [sac.re.compile(p) for p in cfg["etlm_strip_key_patterns"]]

    def test_katie_keys_stripped(self):
        obj = {"regulatory_landscape": {"katie_directives": {"x": 1}, "ratified_by_katie": True,
                                        "keep": "yes"}}
        out = sac.strip_keys(obj, self.strip, self.patterns)
        self.assertEqual(out, {"regulatory_landscape": {"keep": "yes"}})

    def test_renamed_keys_survive_the_strip(self):
        # The 2026-08-29 fix was a RENAME, not a strip — the content must ship.
        obj = {k: "v" for k in RENAMED_KEYS}
        out = sac.strip_keys(obj, self.strip, self.patterns)
        self.assertEqual(set(out), set(RENAMED_KEYS))

    def test_ws13_review_update_pattern_still_strips(self):
        out = sac.strip_keys({"ws13_review_update_S94": "x", "keep": 1}, self.strip, self.patterns)
        self.assertEqual(out, {"keep": 1})


class LeakAndEditorialScans(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self._repo, self._data = sac.REPO, sac.DATA
        sac.REPO, sac.DATA = self.tmp, self.tmp / "atlas"
        sac.DATA.mkdir()

    def tearDown(self):
        sac.REPO, sac.DATA = self._repo, self._data
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_leak_gate_finds_planted_marker(self):
        (sac.DATA / "x.md").write_text("fine\nper S64 asset disposition rule\n")
        self.assertEqual(len(sac.leak_gate()), 1)

    def test_editorial_scan_finds_planted_todo(self):
        (sac.DATA / "x.json").write_text('{"note": "TODO check the label"}')
        ex, hits = sac.editorial_residue()
        self.assertEqual((ex, len(hits)), (1, 1))

    def test_editorial_scan_is_case_sensitive(self):
        # A case-insensitive 'TODO' fires inside ordinary words ('mastodon' carries
        # 'todo'); the scan is case-sensitive by design.
        (sac.DATA / "x.md").write_text("the mastodon genome; todo lists are fine prose\n")
        ex, hits = sac.editorial_residue()
        self.assertEqual((ex, len(hits)), (1, 0))

    def test_clean_tree_is_clean(self):
        (sac.DATA / "x.md").write_text("ordinary prose\n")
        self.assertEqual(sac.leak_gate(), [])
        self.assertEqual(sac.editorial_residue()[1], [])


class SummaryOnly(unittest.TestCase):
    CFG = {"etlm_summary_rows": 3, "etlm_summary_unmet_needs": 3}
    FULL = {
        "indication": "Testium", "indication_code": "tst", "last_updated": "2026-01-01",
        "epidemiology": {"us_incidence": 1000, "note_source": "strip-me"},
        "approved_therapies": [{"n": i} for i in range(10)],
        "pipeline_assets": [{"n": i} for i in range(7)],
        "competitive_dynamics": {"a": 1, "b": 2},
        "unmet_needs": [{"n": i} for i in range(5)],
    }

    def test_summarise_caps_and_counts(self):
        out = sac.summarise_etlm(dict(self.FULL), self.CFG)
        self.assertEqual(len(out["approved_therapies"]), 3)
        self.assertEqual(out["section_counts"]["approved_therapies"], 10)   # TRUE total
        self.assertEqual(out["section_counts"]["competitive_dynamics"], 2)  # dicts counted too
        self.assertNotIn("competitive_dynamics", [k for k in out if k != "section_counts"]
                         if False else out.keys() - {"section_counts"})     # interpretive withheld
        self.assertIs(out["detail_available"], False)

    def _write(self, tmp, obj):
        (tmp / "tst.json").write_text(json.dumps(obj))

    def test_gate_catches_uncapped_section(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            bad = sac.summarise_etlm(dict(self.FULL), self.CFG)
            bad["approved_therapies"] = self.FULL["approved_therapies"]  # reducer "stopped slicing"
            self._write(tmp, bad)
            with self.assertRaises(sac.SyncAborted):
                with redirect_stdout(io.StringIO()):
                    sac.summary_only_gate(tmp, ["tst"], {"tst": {"approved_therapies": 10}}, self.CFG)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_gate_catches_forbidden_section(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            bad = sac.summarise_etlm(dict(self.FULL), self.CFG)
            bad["competitive_dynamics"] = {"leak": 1}
            self._write(tmp, bad)
            with self.assertRaises(sac.SyncAborted):
                with redirect_stdout(io.StringIO()):
                    sac.summary_only_gate(tmp, ["tst"], {}, self.CFG)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_gate_ungateable_on_missing_file(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            with self.assertRaises(sac.SyncAborted):
                with redirect_stdout(io.StringIO()):
                    sac.summary_only_gate(tmp, ["tst"], {}, self.CFG)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_gate_passes_clean(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            self._write(tmp, sac.summarise_etlm(dict(self.FULL), self.CFG))
            with redirect_stdout(io.StringIO()):
                sac.summary_only_gate(tmp, ["tst"], {"tst": {"approved_therapies": 10}}, self.CFG)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class ProvenanceAttestation(unittest.TestCase):
    """--verify-only must refuse a committed bundle that is not byte-identical to what
    the fully-gated sync wrote (Move 2). This is the CI-side half of the attestation."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self._saved = {n: getattr(sac, n) for n in ("REPO", "DATA", "SYNC_PROVENANCE", "load_config")}
        sac.REPO = self.tmp
        sac.DATA = self.tmp / "atlas"
        (sac.DATA / "etlm").mkdir(parents=True)
        sac.SYNC_PROVENANCE = sac.DATA / "_sync_provenance.json"
        sac.load_config = lambda: {"etlm_whitelist": ["tst"]}
        self.payload = json.dumps({"indication": "Testium", "approved_therapies": [1, 2]}, indent=2)
        (sac.DATA / "etlm" / "tst.json").write_text(self.payload)

    def tearDown(self):
        for n, v in self._saved.items():
            setattr(sac, n, v)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _record(self, sha=None, attest=True, with_sha=True):
        rec = {"source_root": "drafts", "source_sha256": "0" * 64,
               "source_mtime": "2026-01-01T00:00:00Z", "shipped_bytes": len(self.payload),
               "top_level_list_counts": {"approved_therapies": 2}}
        if with_sha:
            rec["shipped_sha256"] = sha or hashlib.sha256(self.payload.encode()).hexdigest()
        doc = {sac.BASELINE_KEY: {"tst": rec},
               sac.GATE_STANZA_KEY: {"ran_at": "2026-01-01T00:00:00Z", "codes_examined": 1}}
        if attest:
            doc[sac.PUBLISH_GATES_KEY] = {"ran_at": "2026-01-01T00:00:00Z",
                                          "gates_run": sac.PUBLISH_GATES_RUN}
        sac.SYNC_PROVENANCE.write_text(json.dumps(doc))

    def test_clean_record_passes(self):
        self._record()
        self.assertEqual(sac.verify_provenance(), [])

    def test_missing_attestation_stanza_fails(self):
        self._record(attest=False)
        self.assertTrue(any(sac.PUBLISH_GATES_KEY in f for f in sac.verify_provenance()))

    def test_missing_shipped_sha_fails(self):
        self._record(with_sha=False)
        self.assertTrue(any("shipped_sha256" in f for f in sac.verify_provenance()))

    def test_edited_committed_file_fails(self):
        # The committed file was touched AFTER gating — the exact bypass Move 2 closes.
        self._record()
        (sac.DATA / "etlm" / "tst.json").write_text(self.payload + " ")
        self.assertTrue(any("NOT the bytes" in f for f in sac.verify_provenance()))

    def test_recorded_but_uncommitted_file_fails(self):
        self._record()
        (sac.DATA / "etlm" / "tst.json").unlink()
        self.assertTrue(any("not committed" in f for f in sac.verify_provenance()))


class ContentRegression(unittest.TestCase):
    """D6R mutation cases from S296, persisted: a shrink aborts; a blanked baseline
    entry must not silently un-gate its code."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self._sp = sac.SYNC_PROVENANCE
        sac.SYNC_PROVENANCE = self.tmp / "_sync_provenance.json"

    def tearDown(self):
        sac.SYNC_PROVENANCE = self._sp
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _baseline(self, counts):
        sac.SYNC_PROVENANCE.write_text(json.dumps({
            sac.BASELINE_KEY: {"tst": {"top_level_list_counts": counts}},
            sac.GATE_STANZA_KEY: {"ran_at": "x", "codes_examined": 1}}))

    def _records(self, counts):
        return {"tst": {"source_root": "drafts", "top_level_list_counts": counts}}

    def test_shrink_aborts(self):
        self._baseline({"approved_therapies": 5})
        with self.assertRaises(sac.SyncAborted):
            with redirect_stdout(io.StringIO()):
                sac.content_regression_gate(self._records({"approved_therapies": 3}), frozenset())

    def test_vanished_list_aborts(self):
        self._baseline({"approved_therapies": 5})
        with self.assertRaises(sac.SyncAborted):
            with redirect_stdout(io.StringIO()):
                sac.content_regression_gate(self._records({}), frozenset())

    def test_dropped_code_aborts(self):
        # A whole indication vanishing from the run (whitelist edit) is the coarsest shrink.
        self._baseline({"approved_therapies": 5})
        with self.assertRaises(sac.SyncAborted):
            with redirect_stdout(io.StringIO()):
                sac.content_regression_gate({}, frozenset())

    def test_equal_counts_pass(self):
        self._baseline({"approved_therapies": 5})
        with redirect_stdout(io.StringIO()):
            stanza = sac.content_regression_gate(self._records({"approved_therapies": 5}), frozenset())
        self.assertEqual(stanza["verdict"], "RAN_CLEAN")


if __name__ == "__main__":
    unittest.main()
