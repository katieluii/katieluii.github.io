#!/usr/bin/env python3
"""Sync Atlas deliverables from WS9/WS12 source dirs into kl-portfolio.

Reads (post-2026-06-13 project-home consolidation under ws_professional/):
  - ~/Projects/ws_professional/ws9-etlm/drafts/<indication>/<indication>.json
  - ~/Projects/ws_professional/ws12_news_signal/landscape/tpp_*.md
  - ~/Projects/ws_professional/ws12_news_signal/landscape/themes/*.md
  - ~/Projects/ws_professional/ws12_news_signal/ecosystem_knowledge.md

Applies scripts/atlas-redaction-config.json (whitelists + key-strips).
Writes into src/data/atlas/{etlm,tpp,theme}/ and src/data/atlas/ecosystem.md.
Builds src/data/atlas/cross_link_map.json from filename heuristics + ETLM
pipeline-asset scan.

Run after any ETLM/TPP/theme change you want reflected in the reader.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
CONFIG_PATH = HERE / "atlas-redaction-config.json"
DATA = REPO / "src" / "data" / "atlas"

# --- transactional output (D2) -------------------------------------------------
# The sync used to rmtree the live output dirs and write final paths, THEN run the
# leak gate — so a failed gate left rejected content in the working tree, staged and
# committable, with nothing downstream re-checking it. Now every writer emits into a
# staging dir; the gate runs against staging; only on a clean pass is the result
# promoted onto the live tree.
#
# Promotion is PER-ARTIFACT, never a whole-dir replace: src/data/atlas also holds 12
# repo-owned .ts files (gating.ts, index.ts, soc/profiles.ts, …) plus memo/ and
# analyst_read.json, none of which the sync produces. Replacing the directory
# wholesale would delete them.
SYNC_ARTIFACTS = ["etlm", "tpp", "theme", "ecosystem.md", "cross_link_map.json", "_sync_provenance.json"]

# D6R — the committed publish record, and the baseline the content-regression gate
# compares against. It replaces D6 (which recorded whether each code resolved from
# approved/ or drafts/, and aborted on an unacknowledged switch). Since 2026-08-15
# drafts/ is the SOLE publish root — etlm_whitelist alone governs what publishes — so
# a silent source-of-truth switch is impossible by construction and D6 has nothing
# left to catch. approved/ still exists and still means Gate C human QC; the publish
# path just no longer reads it.
#
# One root creates a DIFFERENT failure, which D6R is for: drafts/ is edited daily and
# wires straight to a push-to-deploy public site, so a truncated or half-patched draft
# publishes itself. D4/D5/D7 and the contradiction sweep all pass a file that has
# merely LOST rows. This file records, per whitelisted code, the source it shipped
# from and a count of every top-level list, so the next run can refuse to ship less.
SYNC_PROVENANCE = DATA / "_sync_provenance.json"

_OUT_ROOT: Path = DATA
STAGING = DATA.parent / ".atlas-staging"


class SyncAborted(Exception):
    """Raised when the sync must not proceed. Always raised BEFORE the live tree is
    touched, so aborting leaves src/data/atlas byte-identical to what was committed."""


class UsageError(Exception):
    """Bad command line. Distinct exit code (2) from a gate abort (1), so a typo in a
    flag can never be mistaken for a clean run OR for a content verdict."""


# Every flag this script honours. An unrecognised flag is REJECTED, never ignored:
# a typo'd `--allow-content-shrnk` silently parsed as "no acknowledgement" would turn
# an intended override into an abort, and — worse in the other direction — any future
# override flag typo'd would read as the safe default while the operator believes the
# opposite. Reject, and the operator finds out immediately.
KNOWN_FLAGS = frozenset({
    "--verify-only",
    "--dry-run",
    "--allow-content-shrink",
    "--init-content-baseline",
})


def parse_flags(args: list[str]) -> frozenset[str]:
    unknown = [a for a in args if a not in KNOWN_FLAGS]
    if unknown:
        raise UsageError(
            "unknown flag(s): " + ", ".join(unknown)
            + "\n  known flags: " + ", ".join(sorted(KNOWN_FLAGS))
            + "\n  Rejected rather than ignored — a misspelled override must not read "
              "as the default."
        )
    return frozenset(args)


def out() -> Path:
    """Current output root — the staging dir mid-sync, the live tree otherwise.
    Every write site and every read-back of a just-written file must use this."""
    return _OUT_ROOT


def promote(staging: Path) -> list[str]:
    """Move the validated staging artifacts onto the live tree, one artifact at a
    time, keeping a backup of each so a mid-promotion failure can be rolled back.

    Only names in SYNC_ARTIFACTS are touched — repo-owned .ts files, memo/ and
    analyst_read.json under src/data/atlas are never candidates for replacement.
    """
    backups: list[tuple[Path, Path]] = []   # (live_path, backup_path)
    promoted: list[str] = []
    try:
        for name in SYNC_ARTIFACTS:
            staged = staging / name
            if not staged.exists():
                continue  # artifact not produced this run (e.g. no themes) — leave live copy
            live = DATA / name
            backup = DATA / f".{name}.bak-{os.getpid()}"
            if live.exists():
                os.replace(live, backup)
                backups.append((live, backup))
            os.replace(staged, live)
            promoted.append(name)
    except Exception:
        # roll back whatever we already swapped, then re-raise
        for live, backup in reversed(backups):
            if backup.exists():
                if live.exists():
                    shutil.rmtree(live) if live.is_dir() else live.unlink()
                os.replace(backup, live)
        raise
    # success — drop the backups
    for _, backup in backups:
        if backup.exists():
            shutil.rmtree(backup) if backup.is_dir() else backup.unlink()
    return promoted


WS_ROOT = Path.home() / "Projects" / "ws_professional"
ETLM_SRC = WS_ROOT / "ws9-etlm" / "drafts"
LANDSCAPE_SRC = WS_ROOT / "ws12_news_signal" / "landscape"
THEMES_SRC = LANDSCAPE_SRC / "themes"
ECOSYSTEM_SRC = WS_ROOT / "ws12_news_signal" / "ecosystem_knowledge.md"

# D7 — benchmark citation gate. The analyst repo owns the guard; this is a
# CONSUMER of it, same as the leak gate is a consumer of atlas-leak-markers.json.
CITATION_GUARD = WS_ROOT / "ws9-etlm" / "scripts" / "benchmark_citation_guard.py"


def _load_citation_guard():
    """Import the analyst repo's citation guard by path, or return None.

    Returns None when the analyst repo is absent (CI) — the caller decides
    whether that is fatal. Deliberately NOT a hard import: this script's
    --verify-only mode runs in CI where WS_ROOT does not exist.
    """
    if not CITATION_GUARD.exists():
        return None
    import importlib.util

    spec = importlib.util.spec_from_file_location("benchmark_citation_guard", CITATION_GUARD)
    if spec is None or spec.loader is None:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


CONTRADICTION_SWEEP = WS_ROOT / "ws9-etlm" / "scripts" / "sweep_value_contradictions.py"


def _load_contradiction_sweep():
    """Import the intra-row contradiction sweep by path, or return None."""
    if not CONTRADICTION_SWEEP.exists():
        return None
    import importlib.util

    spec = importlib.util.spec_from_file_location("sweep_value_contradictions",
                                                  CONTRADICTION_SWEEP)
    if spec is None or spec.loader is None:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def contradiction_gate(resolved: list[tuple[str, Path]]) -> None:
    """Refuse to publish an ETLM row whose own prose contradicts its structured value.

    Sibling of citation_gate, and it exists because citation_gate cannot see this
    class BY CONSTRUCTION. nsclc's `2L_post_platinum_docetaxel` had every citation
    resolve — real PMID, real trial — while the row's label said "docetaxel arm
    ORR 13%" and `best_orr_pct` said 9. The defect was in plain prose one field
    away. urothelial's TROPHY-U-01 row was worse: ORR 41% and mPFS 5.3 are
    Cohort 3 (SG + pembro, CPI-naive) presented as Cohort 1 monotherapy in a
    post-CPI line, overstating ORR by 14 points with a valid PMID attached.

    Same whitelist-only scope as citation_gate, for the same reason: a gate that
    blocks every sync on unpublished work gets routed around within a week.

    THREE verdicts. UNGATEABLE — the sweep examined no values at all — aborts
    just like BLOCK, because a checker that looked at nothing must never be read
    as a pass. The sweep reports its own coverage denominator on every run.
    """
    sweep = _load_contradiction_sweep()
    if sweep is None:
        raise SyncAborted(
            f"intra-row contradiction sweep not found at {CONTRADICTION_SWEEP} — cannot "
            "verify that published efficacy values agree with their own row text. "
            "A resolvable citation does not make the number right."
        )
    rep = sweep.sweep_report([code for code, _ in resolved])
    if rep["verdict"] == sweep.BLOCK:
        lines = [f"{f['code']}: [{f['kind']}] {f['line']} — {f.get('detail', '')}"
                 for f in rep["findings"]]
        raise SyncAborted(
            f"{len(lines)} intra-row value contradiction(s) in the whitelisted set:\n    "
            + "\n    ".join(lines[:20])
            + (f"\n    … and {len(lines) - 20} more" if len(lines) > 20 else "")
            + "\n  The citation may resolve fine — the row disagrees with ITSELF. "
              "Adjudicate against the source before publishing."
        )
    if rep["verdict"] == sweep.UNGATEABLE:
        raise SyncAborted(
            "intra-row contradiction sweep examined 0 numeric values across "
            f"{len(resolved)} whitelisted code(s). That is not a pass — it means the "
            "detector matched no known field name, so the check is not running. "
            "Verify FIELDS still matches the drafts' schema."
        )
    print(f"  ✓ no intra-row value contradictions across {len(resolved)} whitelisted code(s) "
          f"({rep['examined_values']} value(s) examined, {rep['unexamined_values']} stored "
          "under unmapped field names)")


def citation_gate(resolved: list[tuple[str, Path]]) -> None:
    """D7 — refuse to publish an ETLM whose benchmark citations do not resolve.

    Runs BEFORE anything is written, over the EXACT file each whitelisted code
    resolved to — never over a sibling copy of it. The rule outlives the approved/
    preference that first motivated it (drafts/ is the sole publish root since
    2026-08-15): gate the bytes being shipped, so that if resolution ever gains a
    second candidate again, the gate cannot end up checking the file that ISN'T
    published.

    Scope is the whitelist ONLY. Gating all 48 drafts would block every sync on
    unpublished work and the gate would be bypassed within a week; a gate people
    route around is worse than no gate. Unpublished drafts are the standalone
    `benchmark_citation_guard.py` run's job.

    BLOCK-severity findings only. WARNs (copy-paste smell, missing quoted_metric)
    are surfaced but do not stop a sync — they need a source lookup to confirm,
    which is citation-verifier's job, not a deterministic gate's.
    """
    guard = _load_citation_guard()
    if guard is None:
        raise SyncAborted(
            f"benchmark citation guard not found at {CITATION_GUARD} — cannot verify "
            "that published benchmark citations resolve. Publishing unverified efficacy "
            "numbers is the defect this gate exists to prevent."
        )

    dirty: list[str] = []
    total_warns = 0
    for code, src in resolved:
        r = guard.audit_path(src, code)
        total_warns += r["warns"]
        if r["blocks"]:
            for f in r["findings"]:
                if f["severity"] == "BLOCK":
                    dirty.append(f"{code}: [{f['kind']}] {f['location']} — {f['detail']}")

    if dirty:
        raise SyncAborted(
            f"{len(dirty)} unresolvable benchmark citation(s) in the whitelisted set:\n    "
            + "\n    ".join(dirty[:20])
            + (f"\n    … and {len(dirty) - 20} more" if len(dirty) > 20 else "")
            + "\n  Route them: python3 "
            + str(CITATION_GUARD.relative_to(Path.home()))
            + " --route <code>"
        )
    print(f"  ✓ benchmark citations resolve for all {len(resolved)} whitelisted code(s)"
          + (f" ({total_warns} non-blocking warning(s))" if total_warns else ""))


# --- D6R — content-regression gate --------------------------------------------
BASELINE_KEY = "codes"
GATE_STANZA_KEY = "content_regression_gate"


def _utc_iso(ts: Optional[float] = None) -> str:
    """UTC ISO-8601 to whole seconds (2026-08-15T09:14:02Z). Whole seconds so a
    committed record doesn't churn on float noise."""
    dt = datetime.fromtimestamp(ts, tz=timezone.utc) if ts is not None else datetime.now(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _top_level_list_counts(obj: Any) -> dict[str, int]:
    """len() of every top-level key whose SHIPPED value is a list.

    Counts the sanitised copy, not the source: a list dropped by strip_keys never
    ships, so it must not appear in the baseline either. Top-level dicts are not
    counted — see content_regression_gate's docstring for what that leaves open.
    """
    if not isinstance(obj, dict):
        return {}
    return {k: len(v) for k, v in obj.items() if isinstance(v, list)}


def _read_content_baseline() -> tuple[Optional[dict[str, Any]], str]:
    """Read the committed baseline. Returns (codes-map, reason); the map is None
    when there is nothing to compare against.

    None is the DID-NOT-RUN signal and is never collapsed into "no shrink found":
    a missing file, an unreadable file and the legacy D6 {"resolved_root": …}
    schema all mean the gate has no baseline, which is not a pass.
    """
    if not SYNC_PROVENANCE.exists():
        return None, f"no baseline file at {SYNC_PROVENANCE.name}"
    try:
        doc = json.loads(SYNC_PROVENANCE.read_text())
    except (json.JSONDecodeError, OSError) as e:
        return None, f"baseline unreadable ({e.__class__.__name__}: {e})"
    if not isinstance(doc, dict):
        return None, "baseline is not a JSON object"
    if BASELINE_KEY not in doc:
        legacy = " — this is the legacy D6 resolved_root schema" if "resolved_root" in doc else ""
        return None, f"baseline has no '{BASELINE_KEY}' key{legacy}"
    codes = doc[BASELINE_KEY]
    if not isinstance(codes, dict):
        return None, f"baseline '{BASELINE_KEY}' is not an object"
    return codes, "ok"


def content_regression_gate(records: dict[str, Any], flags: frozenset[str]) -> dict[str, Any]:
    """D6R — refuse to publish an ETLM that ships FEWER rows than the live copy has.

    Invariant: no whitelisted code may ship a top-level list SHORTER than the one
    recorded in the committed baseline, unless the run carries an explicit
    --allow-content-shrink, which is itself recorded in the artifact.

    Why it exists. It replaces D6, whose job — catching a silent switch of the
    source of truth between approved/ and drafts/ — became impossible by
    construction when drafts/ became the sole publish root; nothing is lost with
    it. One root creates the opposite exposure: drafts/ is edited daily by hand
    and by the WS12 cron, and now wires straight to a push-to-deploy public site.
    A truncated write or a half-applied patch is invisible to every other gate —
    D4 checks the top-level key SET, D5 checks scrub artifacts, D7 checks that
    citations resolve, and the contradiction sweep checks a row against its own
    prose. All four happily pass a file that has merely lost 40 pipeline assets.

    Per code, FOUR states: NEW (no baseline entry, or an entry with an empty
    counts map — printed loudly, never silent; this closes a real D6 blind spot,
    whose `if c in prior` meant a code added straight into the whitelist could
    never be flagged), OK, SHRANK, and DROPPED (present in the baseline, absent
    from this run — the whole indication stops shipping).

    DROPPED is checked by walking the BASELINE's keys, not this run's. Walking
    only the run's records means a code deleted from etlm_whitelist is never
    examined at all, so the coarsest possible content loss — an entire live page
    deleted — would report RAN_CLEAN. It is also not recoverable after the fact,
    because a promoting run rewrites the artifact and the whitelist together.

    Per run, two states D6 could not express:
      DID-NOT-RUN — 0 codes examined, or a missing/unreadable/legacy-schema
        baseline. Aborts as UNGATEABLE. A checker that examined nothing must
        never exit like a checker that examined everything and found nothing.
      RAN-CLEAN  — recorded in the artifact with ran_at + codes_examined, so a
        later reader can tell a clean run from a run that never happened.

    WHAT THIS GATE DOES NOT CATCH — do not over-trust it:
      * A value CHANGED IN PLACE. Rewriting an ORR from 41% to 4% is
        counts-neutral and passes here. That class belongs to citation_gate,
        contradiction_gate and human review.
      * A row REPLACED by a different row (one out, one in) — also counts-neutral.
      * Shrinkage inside a top-level DICT (efficacy_benchmarks_by_line,
        competitive_dynamics, regulatory_landscape). Only top-level lists are
        counted, per the D6R spec.
      * Anything about correctness of the source. It compares this run to the
        last published run, nothing more.
    """
    allow_shrink = "--allow-content-shrink" in flags
    bootstrap = "--init-content-baseline" in flags
    baseline, why = _read_content_baseline()

    if bootstrap and baseline is not None:
        raise SyncAborted(
            f"--init-content-baseline refused: {SYNC_PROVENANCE.name} already carries a "
            f"usable baseline ({len(baseline)} code(s)). Re-initialising would overwrite "
            "the very counts this gate compares against, making the flag a silent bypass. "
            "To accept a genuine reduction, re-run with --allow-content-shrink."
        )

    if len(records) == 0:
        raise SyncAborted(
            "content-regression gate DID NOT RUN (UNGATEABLE): 0 whitelisted code(s) "
            "examined. That is not a clean pass — it means etlm_whitelist is empty or "
            "resolution produced nothing, so no content was compared to anything."
        )

    if baseline is None and not bootstrap:
        raise SyncAborted(
            f"content-regression gate DID NOT RUN (UNGATEABLE): {why}. With no baseline "
            f"there is nothing to compare {len(records)} code(s) against, and a run that "
            "compared nothing must not publish as if it had.\n"
            "  To write the FIRST baseline (also the migration off the legacy D6 schema):\n"
            "    1. python3 scripts/sync-atlas-content.py --init-content-baseline --dry-run\n"
            "       — builds and gates the candidate bundle, promotes nothing; inspect the\n"
            "         staged _sync_provenance.json under src/data/.atlas-staging/\n"
            "    2. python3 scripts/sync-atlas-content.py --init-content-baseline\n"
            "       — same run, promoted, so the counts become the committed baseline.\n"
            "  Only do this when the CURRENT drafts are known-good: whatever they contain "
            "becomes the floor every later run is measured against."
        )

    new_codes: list[str] = []
    shrank: list[tuple[str, str, int, int, str]] = []   # code, list key, prior, now, note
    corrupt: list[str] = []
    compared_lists = 0

    for code in sorted(records):
        counts = records[code]["top_level_list_counts"]
        prior_entry = baseline.get(code) if baseline is not None else None
        prior_counts = prior_entry.get("top_level_list_counts") if isinstance(prior_entry, dict) else None
        if not isinstance(prior_counts, dict) or not prior_counts:
            # No entry at all, OR an entry whose counts map is EMPTY. The `not
            # prior_counts` half is load-bearing: {} is a dict, so an isinstance
            # check alone let an empty map through, the comparison loop below ran
            # zero times, and the code was still tallied into codes_examined — a
            # blanked baseline entry silently un-gated its code while the run
            # reported RAN_CLEAN. Caught by mutation, not by reading.
            new_codes.append(code)
            continue
        for key in sorted(prior_counts):
            prior_n = prior_counts[key]
            if not isinstance(prior_n, int) or isinstance(prior_n, bool):
                corrupt.append(f"{code}.{key} = {prior_n!r}")
                continue
            # `is None` is the absence test, never `not now_n`: urothelial ships
            # novel_targets and preclinical_watchlist as legitimate 0-length lists,
            # and a truthiness check would read those as missing.
            now_raw = counts.get(key)
            absent = now_raw is None
            now_n = 0 if absent else now_raw
            if now_n < prior_n:
                # A key that stopped shipping is a shrink to zero — same comparison,
                # so a list recorded at 0 that later vanishes is correctly a no-op.
                shrank.append((code, key, prior_n, now_n,
                               "list no longer ships at all" if absent else ""))
            compared_lists += 1

    if corrupt:
        raise SyncAborted(
            "content-regression gate DID NOT RUN (UNGATEABLE): the committed baseline "
            f"carries {len(corrupt)} non-integer list count(s): {', '.join(corrupt[:10])}"
            + (f" … and {len(corrupt) - 10} more" if len(corrupt) > 10 else "")
            + ". A corrupt baseline cannot certify anything; repair or re-initialise it."
        )

    # A code that DISAPPEARS from the whitelist is the coarsest possible shrink —
    # the whole indication stops shipping and its page dies. The loop above walks
    # `records`, i.e. only what this run resolved, so a dropped code was never
    # examined and the run reported RAN_CLEAN. Nor was it detectable afterwards:
    # verify_provenance compares the artifact against the whitelist, and a
    # promoting run rewrites both together, so the evidence erases itself. Walk
    # the BASELINE's keys to catch it. One config line was all it took.
    dropped = sorted(set(baseline) - set(records)) if baseline is not None else []
    if dropped and not allow_shrink:
        raise SyncAborted(
            f"{len(dropped)} code(s) in the published baseline are ABSENT from this run: "
            + ", ".join(dropped)
            + ".\n  Each is a live indication whose page would be deleted from the site. "
              "This is a shrink of the whole bundle, not of a list inside it — most "
              "likely an edit to etlm_whitelist. If the removal is intended, re-run with "
              "--allow-content-shrink to accept and record it."
        )

    # The honest denominator. codes_examined > 0 says the loop was entered; it does
    # NOT say anything was compared. A baseline of entries that all carry empty or
    # unmatched count maps yields zero comparisons while still looking like a run.
    if compared_lists == 0 and not new_codes:
        raise SyncAborted(
            "content-regression gate DID NOT RUN (UNGATEABLE): examined "
            f"{len(records)} code(s) but compared 0 list(s). Every baseline entry was "
            "empty or unmatched, so nothing was actually checked. An examined count is "
            "not a comparison count."
        )

    for code in new_codes:
        n_lists = len(records[code]["top_level_list_counts"])
        print(f"  !! NEW {code}: no baseline entry — nothing to compare against. Its "
              f"{n_lists} top-level list count(s) become the baseline from this run on.")

    if shrank and not allow_shrink:
        lines = [f"{c}.{k}: {p} → {n} row(s)" + (f"  ({note})" if note else "")
                 for c, k, p, n, note in shrank]
        raise SyncAborted(
            f"{len(lines)} top-level list(s) SHRANK against the published baseline:\n    "
            + "\n    ".join(lines[:20])
            + (f"\n    … and {len(lines) - 20} more" if len(lines) > 20 else "")
            + "\n  drafts/ is a shared, daily-edited write surface and publishes straight "
              "to the live site, so this is what a truncated or half-applied edit looks "
              "like. Check the draft(s) first. If the reduction is real and intended, "
              "re-run with --allow-content-shrink to accept and record it."
        )

    verdict = "RAN_CLEAN"
    if baseline is None:
        verdict = "BOOTSTRAP"
    elif shrank:
        verdict = "RAN_SHRINK_ACKNOWLEDGED"
        for c, k, p, n, note in shrank:
            print(f"  !! SHRANK (accepted via --allow-content-shrink) {c}.{k}: {p} → {n} row(s)"
                  + (f"  ({note})" if note else ""))

    if verdict == "BOOTSTRAP":
        print(f"  ⚑ content-regression gate BOOTSTRAP — no prior baseline ({why}); "
              f"{len(records)} code(s) recorded as the new floor, nothing compared")
    else:
        print(f"  ✓ content-regression gate {verdict} — {len(records)} code(s) examined, "
              f"{compared_lists} top-level list(s) compared, "
              f"{len(shrank)} shorter than baseline, {len(new_codes)} new")

    return {
        "ran_at": _utc_iso(),
        "verdict": verdict,
        "codes_examined": len(records),
        "lists_compared": compared_lists,
        "new_codes": new_codes,
        "shrink_acknowledged": [
            {"code": c, "list": k, "prior": p, "now": n} for c, k, p, n, _ in shrank
        ],
    }


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text())


def strip_keys(obj: Any, strip: set[str], patterns: list[re.Pattern[str]] | None = None) -> Any:
    patterns = patterns or []

    def _drop(k: str) -> bool:
        return k in strip or any(p.search(k) for p in patterns)

    if isinstance(obj, dict):
        return {k: strip_keys(v, strip, patterns) for k, v in obj.items() if not _drop(k)}
    if isinstance(obj, list):
        return [strip_keys(v, strip, patterns) for v in obj]
    return obj


# --- Value-content scrub (client-facing) -----------------------------------
# A key-strip can't touch editorial prose embedded INSIDE a value string
# (e.g. "Phase 3 (analyst-known, verify)" or "…finalize before shipping").
# The shipped bundle is fully inspectable, so we remove editorial clauses from
# every string before writing the client copy. Editor notes stay in the WS9
# draft (source of truth); only the synced client copy is scrubbed.
# Ordered highest-signal first; paren-guarded patterns are safe (only fire when
# an editorial token is inside the parens / after a clause separator).
_EDITORIAL_TOKENS = (
    r"analyst-known|review-cited|NEEDS PRIMARY VERIFICATION|pull suppl\.?|"
    r"finalize before shipping|digit-level unverified|were pooled-label|"
    r"pooled-label-mislabel\w*|mislabel of|reconcile[^.;)\]]*next pass|"
    r"TODO|FIXME|INTERNAL:"
)
# 1) bracketed/parenthetical group containing an editorial token → drop whole group
_GRP_EDITORIAL = re.compile(
    r"\s*[(\[][^)\]]*(?:" + _EDITORIAL_TOKENS + r")[^)\]]*[)\]]", re.I
)
# 2) editorial clause from the token to the next sentence end, with any leading
#    separator/space (comma, period-space, dash, semicolon, colon) → drop clause
_CLAUSE_EDITORIAL = re.compile(
    r"\s*[,;:—-]?\s*(?:" + _EDITORIAL_TOKENS + r")[^.]*\.?", re.I
)
# 3) stray "verify" QC directive. Careful: preserve any real caveat that shares
#    the parenthetical. "(verify — label-derived estimate)" → "(label-derived
#    estimate)" (keep the why-to-distrust caveat); "(verify final label)" → drop
#    (pure directive); "(verify)" → drop; trailing "; verify …" → drop.
_VERIFY_KEEP_CAVEAT = re.compile(r"\(\s*verify\s*[—-]\s*([^)]*)\)", re.I)
_VERIFY_PAREN = re.compile(r"\s*\(\s*verify\b[^)]*\)", re.I)
_VERIFY_CLAUSE = re.compile(r"\s*[;,]\s*verify\b[^.)\]\"]*", re.I)


def _strip_verify(s: str) -> str:
    s = _VERIFY_KEEP_CAVEAT.sub(r"(\1)", s)  # keep the caveat, drop the "verify —"
    s = _VERIFY_PAREN.sub("", s)             # pure "(verify …)" directive
    s = _VERIFY_CLAUSE.sub("", s)            # trailing "; verify …"
    return s

# Extra config-driven editorial tokens (atlas-redaction-config.json →
# etlm_value_scrub_extra_tokens). Compiled once via configure_scrub(); default
# empty so the module is safe to import standalone.
_EXTRA_GRP: re.Pattern[str] | None = None
_EXTRA_CLAUSE: re.Pattern[str] | None = None


def configure_scrub(extra_tokens: list[str]) -> None:
    """Fold config-supplied editorial tokens into the value scrubbers."""
    global _EXTRA_GRP, _EXTRA_CLAUSE
    if not extra_tokens:
        _EXTRA_GRP = _EXTRA_CLAUSE = None
        return
    alt = "|".join(extra_tokens)
    _EXTRA_GRP = re.compile(r"\s*[(\[][^)\]]*(?:" + alt + r")[^)\]]*[)\]]", re.I)
    _EXTRA_CLAUSE = re.compile(r"\s*[,;:—-]?\s*(?:" + alt + r")[^.]*\.?", re.I)


# Surgical removal of internal analyst/PM editorial woven INTO otherwise-client
# values (attribution, session refs, human rulings, workflow state). Each pattern
# includes its own leading connective ("verified by", "per", "deferred to") so
# the scrub leaves a clean value, not a dangling "verified by ". These target the
# author's name and internal process — never clinical content.
_INTERNAL_PHRASES = [
    # whole parenthetical human-ruling annotation → drop the balanced paren
    re.compile(r"\s*\(\s*(?:per\s+)?Katie (?:ruling|directive|disposition|NOTE-IT)\b[^)]*\)", re.I),
    # trailing inline human-ruling clause → consume to end of value
    re.compile(r"\s*[;,—-]?\s*(?:per\s+)?Katie (?:ruling|directive|disposition|NOTE-IT)\b.*$", re.I),
    re.compile(r"\s*[;,]?\s*verified by Katie\b[^.\"]*", re.I),
    re.compile(r"\s*[;,]?\s*(?:Schema decision\s+)?deferred to Katie\b[^.\"]*", re.I),
    # Greedy [^."]* (not lazy) so the clause is consumed through its LAST
    # qualifying noun: "per S64 asset disposition rule" must not strip to
    # "... disposition" and leave a dangling " rule". Still bounded by the
    # sentence end and the quote, so it cannot run past one value.
    re.compile(r"\s*[;,]?\s*per S\d+\b[^.\"]*\b"
               r"(?:rules?|precedents?|conventions?|decisions?|policy|policies"
               r"|dispositions?)\b", re.I),
    re.compile(r"\s*\(?\bNOTE-IT\b\)?", re.I),
    re.compile(r"\bHUMAN_REVIEW\b|\bAUTO_APPLY\b", re.I),
]


def _strip_internal_phrases(s: str) -> str:
    for pat in _INTERNAL_PHRASES:
        s = pat.sub("", s)
    return s


# --- Internal-system-token scrub for ETLM VALUES ----------------------------
# The counterpart of markdown_inline_replacements, for the JSON surface. The two
# scrub vehicles that existed before this both destroy client content on the shapes
# below, so neither could be used:
#
#   * etlm_strip_keys removes a KEY and its whole subtree. Right for pure bookkeeping
#     (added_cycle, kb_event_ids). Wrong here: every value below hangs off a field a
#     reader needs — source, note, unmet_needs, primary_endpoint — and the internal
#     token is wrapped AROUND real content, not the other way round.
#   * etlm_value_scrub_extra_tokens folds a token into _EXTRA_GRP/_EXTRA_CLAUSE, which
#     delete from the token to the next sentence end. Measured against this bundle on
#     2026-08-16, adding the tokens there gives:
#         "WS13 review s41573-026-01427-1 (Petersen, NRDD 2026), p.4"  ->  "4"
#         "Fang W et al. BMJ 2025; PMID 40473437; event_id 4 (priority 0.45)"
#                                     ->  "Fang W et al. BMJ 2025; PMID 4047343745)"
#     i.e. a Springer article id and its citation deleted outright, and a PMID
#     CORRUPTED into a different number. That vehicle is unusable for anything whose
#     internal token sits next to a citation, which is most of this set.
#
# So: an ordered list of surgical (why, pattern, replacement) substitutions, same shape
# and same discipline as markdown_inline_replacements. Rules live in code rather than
# in atlas-redaction-config.json deliberately — several need a capture group or a
# capitalisation-correct literal ("Review" vs "review") that a token list cannot carry,
# and each one's justification is longer than the pattern it explains.
#
# ORDER IS LOAD-BEARING, exactly as on the markdown side: the anchored KB-event and
# id-reference forms must consume their whole clause before the bare 'KB' / bare 'WS<n>'
# rules can bite a piece out of it, and the WS<n>-review variants must run before the
# WS<n> backstop or the surviving word loses its sentence case.
#
# The governing constraint on every rule: NEVER destroy a citation or a clinical fact to
# remove an internal token, and never scrub a non-empty value to empty — D5 fails the
# sync on that, and an empty `source` is worse than a vague one.
_ETLM_INLINE_RULE_SPECS: list[tuple[str, str, str]] = [

    # ---- WS10a: citation namespace -----------------------------------------
    ("obesity preclinical_watchlist/novel_targets/pipeline sources carry the Literature "
     "Scout namespace on an otherwise-real citation: 'WS10a:pmid:40550229'. The PMID IS "
     "the citation; only the namespace is internal. Rewritten to the public citation "
     "form, never deleted — 10 sources in obesity would otherwise lose their only id.",
     r"\bWS\d+[a-z]?:pmid:(\d{6,9})\b", r"PMID \1"),
    ("Same namespace over a bioRxiv DOI: 'WS10a:biorxiv:10.64898/2026.04.18.719366'.",
     r"\bWS\d+[a-z]?:biorxiv:(\S+)", r"bioRxiv \1"),

    # ---- whole-value internal KB provenance --------------------------------
    ("obesity recent_conference_readouts[0].source and its sources[0].label are ENTIRELY "
     "internal ('WS12 KB cycle7_thmd2 + cycle8_thmd3 + cycle9_thmd4, "
     "landscape/obesity.json') — no citation, no clinical fact, nothing a reader can use. "
     "It still cannot be deleted: D5 fails a non-empty value scrubbed to empty, and an "
     "empty source is worse than a vague one. It collapses to the same public vocabulary "
     "the shipped TPP/theme markdown already uses for this system.",
     r"^WS\d+ KB cycle[\w+ ]*?(?:,\s*[\w./-]+\.(?:json|md|sqlite))?$", "Knowledge base"),

    # ---- bare KB in an ETLM value ------------------------------------------
    ("'Corrects a KB gap: the trial that reported ...' — bare uppercase KB as internal "
     "shorthand for the knowledge base, in a note whose substance (a first Phase 3 "
     "efficacy win, and which trial it corrects) is entirely reader-facing. The "
     "markdown lane has had a \\bKB\\b rule since the theme files; the ETLM lane did "
     "not, and today's cycle wrote the first instance. Case-sensitive on the uppercase "
     "form so a lowercase 'kb' (kilobase, a real genomics unit) is never touched.",
     r"\bKB\b", "coverage"),

    # ---- internal adjudication trailing a real clinical note ----------------
    ("obesity preclinical_watchlist[].combination_context ends with the record of an "
     "internal board decision: 'Whether/how to capture the FDC itself went to the "
     "ws12-board in cycle152 and returned a SPLIT (framings B vs C, GPT seat failed); "
     "that remains Katie's open call and is NOT decided here.' Everything before it — "
     "the FDC composition, the two NCTs, the press-release-only disclosure, the absent "
     "IND — is exactly the kind of caveat a reader needs. Anchored on the board marker "
     "and consumed to the end of the value, so the sentence it lives in goes whole "
     "rather than leaving 'Whether/how to capture the FDC itself went to the .'",
     r"\s*[A-Z][^.]*?\bws\d+-board\b.*$", ""),

    # ---- upstream KB bookkeeping in a public field -------------------------
    ("obesity pipeline_assets[].identity_note carries a WS12 ingestion post-mortem: "
     "'KB DEFECT CORRECTED: KB asset_id 6396 carried canonical_name ... an ingestion "
     "artifact of the synthesiser reading interventions[].name as the asset name ... "
     "The defective name was NOT propagated into this ETLM row.' Every clause is about "
     "the upstream pipeline, not the drug, and it names an internal asset_id. The one "
     "reader-relevant fact is which asset this row is. Rewritten rather than deleted "
     "because D5 fails a value scrubbed to empty, and an empty identity_note is worse "
     "than a short true one. The durable fix belongs upstream in the synthesiser.",
     r"^KB DEFECT CORRECTED:.*?The real asset is ([A-Za-z0-9-]+)\..*$",
     r"Asset identity confirmed as \1."),

    # ---- superseded_label: internal ids inside a citation --------------------
    ("`superseded_label` records the label a source previously carried. It was briefly added "
     "to etlm_strip_keys to kill two internal event_id fragments — which destroyed content: "
     "8 of its 12 corpus values are pure citations, and NCT04649213 (EHA 2026 belantamab "
     "mafodotin) exists in NO other shipped field, so key-stripping deleted it from the public "
     "corpus outright. The internal part is only ever a parenthetical `event_id N` list, so it "
     "is a value-scrub, not a key-strip. Handles both `(...; event_id 1999/1998/1997/1996)` "
     "and `(event_id 1961; Janssen)`.",
     r";\s*event_id\s*[\d/]+(?=\s*\))", ""),
    ("The same id list when it OPENS the parenthetical — `(event_id 1961; Janssen)` becomes "
     "`(Janssen)`. Kept as a second rule rather than one clever alternation so each seam stays "
     "readable and independently testable.",
     r"\(\s*event_id\s*[\d/]+;\s*", "("),

    # ---- KB event references ------------------------------------------------
    ("Leading 'WS12 KB event 685 — ' on a sources[].label whose real content is the trial "
     "description that follows (3 crc labels). Drops the id, label stays non-empty.",
     r"^(?:WS\d+ )?KB events? (?:IDs? )?\d+(?:\s*[/,]\s*\d+)*\s*[—–-]\s*", ""),
    ("'CORRECTION of WS12 KB event 4309 (…)' opening nsclc's zipalertinib correction — a "
     "high-value clinical correction whose object must keep a noun. The value's own next "
     "sentences call it the extracted event, so that is what it is named; no id survives.",
     r"\bCORRECTION of (?:WS\d+ )?KB event \d+\b", "CORRECTION of the extracted feed event"),
    ("The internal feed-article ids inside that same correction's provenance paren, "
     "'source article 3384 BioSpace / 3360 BioPharma Dive'. BioSpace and BioPharma Dive "
     "are real publications the correction argues from and both stay; only the row "
     "numbers go. Anchored on the literal 'source article' so it cannot reach a real "
     "figure elsewhere.",
     r"\bsource articles?\s+\d+\s+([A-Za-z][\w.&'-]*(?:\s+[A-Za-z][\w.&'-]*)*)\s*/\s*\d+\s+",
     r"\1 / "),
    ("Parenthetical whose whole content is a KB event id — '(WS12 KB event 692)', "
     "'(KB event 287)'. The NCT and the trial name sit outside the paren, untouched.",
     r"\s*[;,]?\s*\((?:WS\d+ )?KB events? (?:IDs? )?\d+(?:\s*[/,]\s*\d+)*\)", ""),
    ("Trailing '; KB event ID 9' / '; KB event IDs 7, 8' after a real conference citation.",
     r"\s*;\s*(?:WS\d+ )?KB events? (?:IDs? )?\d+(?:\s*[/,]\s*\d+)*", ""),
    ("Trailing 'Source: KB events 192/195/197 (priority 0.97-0.98), 2026-06-09.' closing "
     "the GSK/Nuvalent note, and the id-only twin 'Source: event_ids 194/196/199 "
     "(priority 0.85-0.93), 2026-06-09.' closing the EVOKE-03 halt note. The internal "
     "priority score goes with the ids. Everything before it — deal value, asset names, "
     "PDUFA context, the halted-trial finding — is the deliverable and is left whole. "
     "End-anchored so it can only ever eat the final clause. The trailing '.' is OPTIONAL "
     "AND CONSUMED on purpose: the raw draft value ends with a full stop and _scrub_str "
     "does not rstrip it until after these rules run, so an anchor without it silently "
     "matches nothing on the real input. Both instances were caught by the D8 gate, not "
     "by inspection.",
     r"\s*\bSource: (?:WS\d+ )?(?:KB events?|event_ids?|signal_ids?|macro_signal_ids?)"
     r" ?(?:IDs? )?\d+(?:\s*[/,]\s*\d+)*(?:\s*\([^)]*\))?"
     r"(?:,\s*\d{4}-\d{2}-\d{2})?\.?\s*$", ""),
    ("'… noted in KB event 2094; oral GLP-1 adoption …' — mid-sentence attribution to a "
     "feed row. Dropping the phrase leaves the competitive claim intact on both sides.",
     r"\s*,?\s*\bnoted in (?:WS\d+ )?KB event \d+", ""),
    ("'(WS12 event 251)' / '(WS12 event 3828)' — the bare event form with no 'KB'.",
     r"\s*\((?:per\s+)?WS\d+ events? \d+\)", ""),

    # ---- event_id / signal_id ----------------------------------------------
    ("Paren that OPENS with the id but carries reader content after it: "
     "'(event_id 2006; EMN/Fondazione EMN Italy)', '(event_id 2061, 2026-06-02)'. Only "
     "the id and its separator go, so the sponsor or the readout date survives INSIDE "
     "the paren. Deleting the whole paren here would lose a trial sponsor.",
     r"\((?:macro\s+)?(?:event_ids?|signal_ids?)\s*\d+(?:\s*[/,]\s*\d+)*\s*[;,]\s*", "("),
    ("Paren whose ENTIRE content is the id — '(event_id 163)', '(signal_id 106)'. Removed "
     "whole, so no '()' artifact is left for D5 to catch.",
     r"\s*\((?:macro\s+)?(?:event_ids?|signal_ids?)\s*\d+(?:\s*[/,]\s*\d+)*\)", ""),
    ("The internal feed RANKING score, once the rule above has taken the id that used to "
     "sit in front of it: '(event_ids 192/195/197, priority 0.97-0.98)' becomes "
     "'(priority 0.97-0.98)', which is an internal score standing alone in a paren THIS "
     "rule set created — a defect of its own making, so it is repaired here rather than "
     "left. Requires a NUMERIC score, which is what keeps it away from 'Priority Review' "
     "— an FDA designation that appears twice in the bundle and must never be touched.",
     r"\s*\(priority \d+\.\d+(?:\s*-\s*\d+\.\d+)?\)", ""),
    ("Trailing '; event_id 189 (priority 0.78)' / ', event_id 219' on a conference source "
     "(16 sources across 5 codes). The internal ranking score goes with the id. Bounded "
     "to two words after the separator so a following clause is never eaten — "
     "'; investigator-led', '; Hoffmann-La Roche / Genentech' and ', NCT04035486' all "
     "survive, and the last of those is a trial id this rule must not reach.",
     r"\s*[;,]\s*(?:[A-Za-z][\w.-]*\s+){0,2}(?:event_ids?|signal_ids?|macro_signal_ids?)"
     r"\s*\d+(?:\s*[/,]\s*\d+)*(?:\s*\(priority[^)]*\))?", ""),
    ("'per WS12 event_id 12' inside obesity's placeholder note — the IND-filing date "
     "immediately before it is the reader-facing fact and stays.",
     r"\s*(?:per\s+)?WS\d+ event_ids?\s*\d+", ""),
    ("Bare 'macro signal_id 183/181' mid-clause: 'monitor WuXi 1260H macro signal_id "
     "183/181 if US sites added' -> 'monitor WuXi 1260H if US sites added'. Runs after "
     "the anchored forms above so it only ever catches what they left.",
     r"\s*(?:macro\s+)?signal_ids?\s*\d+(?:\s*[/,]\s*\d+)*", ""),

    # ---- hr-resolver attribution -------------------------------------------
    ("'; resolved via hr-resolver Cat 1' closing an approval source. Consumed with its "
     "leading separator so the FDA approval date and the NCT before it keep their "
     "punctuation. Must precede the two general hr-resolver rules below.",
     r"\s*[;,]\s*resolved via hr-resolver\s+Cat\s?-?\s?\d+\b", ""),
    ("'CORRECTION applied by hr-resolver 2026-07-23:' — the n=177-vs-N=117 adjudication "
     "is the single highest-value clinical correction in the bundle. Only the agent name "
     "goes; the date, the arithmetic and the label verification all stay.",
     r"\s*\bby hr-resolver\b", ""),
    ("'verified 2026-08-02 via hr-resolver Cat-1 research: EMD Serono/Pfizer Phase 2 …' — "
     "the verification date and everything after the colon (arms, n, status, the PMID) "
     "are real. Only the route is internal.",
     r"\s*\bvia hr-resolver(?:\s+Cat-?\s?\d+(?:\s+research)?)?\b", ""),
    ("'(hr-resolver re-sweep)' qualifying a LABEL-VERIFIED stamp.",
     r"\s*\(hr-resolver re-sweep\)", ""),
    ("Backstop: the agent name opening a bracketed or parenthesised provenance stamp — "
     "'[hr-resolver 2026-08-12, Category-1 verified against the primary publication]', "
     "'(hr-resolver 2026-07-23; zero-efficacy, context only)'. The date and the caveat "
     "that follow are reader-facing and stay, so the bracket is never dropped whole.",
     r"\bhr-resolver\s*", ""),

    # ---- WS<n> pipeline-reconcile ------------------------------------------
    ("'Fresh fetch via WS18 pipeline-reconcile 2026-06-20' closing four crc sources. Each "
     "of those opens with a ClinicalTrials.gov NCT and an Ann Oncol / JCO citation; this "
     "clause is anchored on its own wording and reaches none of them.",
     r"\s*[.;]?\s*\bFresh fetch via WS\d+ pipeline-reconcile \d{4}-\d{2}-\d{2}\b", ""),
    ("'Supersedes the prior WS18 pipeline-reconcile 2026-06-20 note' — the supersession "
     "is a real editorial fact and the date is real; only the pipeline name is internal.",
     r"\bWS\d+ pipeline-reconcile\s+", ""),

    # ---- WS<n> HR batch ------------------------------------------------------
    ("'(WS12 HR batch 2026-06-14, no-efficacy pipeline add)' — the largest single group "
     "(7 occurrences across nsclc and nhl_dlbcl). Pure internal batch bookkeeping wrapped "
     "around the clinical statement 'trial_start only — no efficacy readout yet', which "
     "is the part the reader needs and is what remains.",
     r"\s*\(WS\d+ HR batch [^)]*\)", ""),

    # ---- cycle references in prose ------------------------------------------
    ("'as of cycle 6' dating a China-origin or legislative status (3 nsclc fields). The "
     "cycle number means nothing to a reader and no calendar date can be substituted "
     "without inventing one, so the clause goes and the status claim stands alone.",
     r"\s*,?\s*\bas of cycle\s?\d+\w*", ""),
    ("'(WS12 cycle58)' appended to a trial_start note.",
     r"\s*\(WS\d+ cycle\s?\d+\w*\)", ""),
    ("'(Jacobio; added cycle10 per E9)' in the COINS Act affected-asset list — the "
     "sponsor is real and stays, the cycle and edit id are not.",
     r"\s*;\s*added cycle\s?\d+\w* per [A-Za-z0-9]+", ""),
    ("'CYCLE16 UPDATE:' heading a competitive-positioning addendum. The addendum is "
     "content; only its cycle stamp is internal.",
     r"\bCYCLE\s?\d+\w* UPDATE\b", "UPDATE"),
    ("'(cycle 8 ADDENDUM)' labelling a data-gap entry.",
     r"\(cycle\s?\d+\w*\s+(ADDENDUM|UPDATE)\)", r"(\1)"),
    ("\"corrects cycle21 landscape 'triple/glucagon' descriptor\" — the mechanism "
     "correction (it is a DUAL agonist) is clinical content; the cycle number is replaced "
     "by a reader-meaningful 'prior' rather than deleted, so the sentence keeps its "
     "subject.",
     r"\bcorrects cycle\s?\d+\w* landscape\b", "corrects the prior landscape"),
    ("\"cycle21 'GIPR/GLP-1R' descriptor is questionable\" — same substitution where the "
     "cycle stamp is the grammatical subject of a quoted descriptor.",
     r"\bcycle\s?\d+\w*(?=\s+['‘\"])", "the prior"),
    ("\"NCT resolved cycle65 (was 'NCT not provided WARN')\" — the resolution is the fact.",
     r"\s+resolved cycle\s?\d+\w*", " resolved"),
    ("'(Jun 13-16, 5-8 days from cycle date)' — the conference dates are reader-facing, "
     "their distance from an internal cycle date is not.",
     r"\s*,?\s*\d+-\d+ days from cycle date", ""),
    ("'will be queued in cycle 10 if obesity-relevant readouts surface'.",
     r"\s+in cycle\s?\d+\w*(?=\s+if\b)", ""),
    ("Leading 'WS12 cycle55 (2026-06-22); ' on three obesity sources — the DATE is "
     "reader-facing and is promoted to the front of the value rather than lost with the "
     "cycle token. Must precede the two bare leading-cycle rules below.",
     r"^WS\d+ cycle\s?\d+\w*\s*\((\d{4}-\d{2}-\d{2})\)\s*[;,]\s*", r"\1; "),
    ("Leading 'WS12 cycle50; ' / 'WS12 cycle21_mega; ' on an mm source whose real content "
     "is the CT.gov NCT immediately after the semicolon.",
     r"^WS\d+ cycle\s?\d+\w*\s*[;,]\s*", ""),
    ("Leading 'WS12 cycle 6 ' on nsclc sources naming real class themes and a Lancet "
     "Respir Med citation.",
     r"^WS\d+ cycle\s?\d+\w*\s+", ""),

    # ---- catalyst DB ---------------------------------------------------------
    ("'exon20ins theme + catalyst DB' — the internal catalyst database. This source is "
     "the one value in the set with no citation and no clinical fact at all, but D5 "
     "forbids emptying it, so the only reader-meaningful fragment ('exon20ins theme') is "
     "what remains rather than a blank source field.",
     r"\s*\+\s*catalyst DB\b", ""),
    ("'Phase 3 active in catalyst DB, no readout date assigned' -> 'Phase 3 active, no "
     "readout date assigned'. The trial-status fact survives the removal.",
     r"\s+in catalyst DB\b", ""),

    # ---- bare 'KB' in prose --------------------------------------------------
    ("'the obesity KB' -> 'the obesity knowledge base'. Article-carrying qualified form; "
     "MUST precede the unqualified rules or the replacement doubles the article, exactly "
     "as documented for the markdown side.",
     r"\bthe ([A-Za-z][\w/]*) KB\b", r"the \1 knowledge base"),
    ("'not captured in WS12 KB' -> 'not captured in the knowledge base'. Same public "
     "vocabulary the shipped TPP/theme markdown already uses for this system, so the two "
     "surfaces read alike.",
     r"\bWS\d+ KB\b", "the knowledge base"),
    ("'Asset remains KB-only', \"the KB-only autologous 'BAFF-ligand CAR-T' entry\".",
     r"\bKB-only\b", "knowledge-base-only"),
    ("\"the KB's speculative 'BCMA ADC' framing\" / \"this KB's own carried review item\".",
     r"\b(the|this) KB's\b", r"\1 knowledge base's"),
    ("'no target/class disclosed at time of KB entry'.",
     r"\bat time of KB entry\b", "at time of entry"),
    ("'not stated in KB entry at time of addition' and crc's primary_endpoint value "
     "'Not specified in KB entry'. The phrase goes whole; 'Not specified' remains a "
     "valid, non-empty primary_endpoint.",
     r"\s+in (?:the )?KB entry\b", ""),
    ("'NCT not confirmed from KB; P2 (RECRUITING)' — a `trial` field.",
     r"\s+from KB\b", ""),
    ("'No competitor adjuvant RET programme exists in KB.'",
     r"\s+in KB\b", ""),
    ("\"the KB 'bispecific' framing\" — remaining article-carrying form.",
     r"\bthe KB\b", "the knowledge base"),

    # ---- WS<n> backstop ------------------------------------------------------
    ("'(WS8-owned)' marking internal ownership of a watch item, on a `conference` field.",
     r"\s*\(WS\d+[a-z]?-owned\)", ""),
    ("'WS13 review s41573-026-01427-1 (Petersen, NRDD 2026), p.4' — the Springer article "
     "id, the author-journal-year citation and the page are ALL real and ALL survive; "
     "only the workstream label goes. Four ordered variants so the surviving word keeps "
     "sentence case at a value start and after a full stop, and stays lowercase "
     "mid-sentence. 15 obesity values, every one of them a citation.",
     r"^WS\d+ reviews\b", "Reviews"),
    ("(see above) value-initial singular.", r"^WS\d+ review\b", "Review"),
    ("(see above) sentence-initial after a full stop — 'older adults. WS13 review "
     "(Drucker, NRDD 2025, p.641) elevates …' in obesity.unmet_needs[0].",
     r"(?<=\.\s)WS\d+ review\b", "Review"),
    ("(see above) mid-sentence — 'high-dose + biased-mono additions from WS13 review "
     "s41573-026-01427-1 (Petersen, NRDD 2026)'.",
     r"\bWS\d+ (reviews?)\b", r"\1"),
    ("Value-initial 'WS12 feed (NCT not provided)' — the NCT-availability caveat is the "
     "reader content and the field must not empty, so sentence case is preserved.",
     r"^WS\d+ feed\b", "Feed"),
    ("Backstop: any remaining uppercase workstream token in a surviving value. Runs LAST "
     "so every rule above gets its reader-facing rewrite first; this only catches a form "
     "no rule anticipated, where dropping the token is safer than shipping the internal "
     "system name. Case-SENSITIVE on purpose: a lowercase 'ws12-indication-analyst' slug "
     "must not be shredded into '-indication-analyst'.",
     r"\bWS\d+[a-z]?\b\s*", ""),
]

_ETLM_INLINE_RULES = [(why, re.compile(pat), rep)
                      for why, pat, rep in _ETLM_INLINE_RULE_SPECS]

# Repairs applied ONLY to a value one of the rules above actually altered — the same
# "tidy only what you damaged" convention _scrub_inline() uses on the markdown side. A
# value no rule touched is returned byte-identical, so this can never reflow untouched
# client prose. Each entry targets a seam a removal leaves, and between them they are
# what keeps D5's _SCRUB_ARTIFACT (empty parens, space-before-close) at zero.
_ETLM_INLINE_TIDY = [
    (re.compile(r"[ \t]{2,}"), " "),
    (re.compile(r"\(\s+"), "("),
    (re.compile(r"\[\s+"), "["),
    (re.compile(r"\s+([)\]])"), r"\1"),
    (re.compile(r"\s+([,;.])"), r"\1"),
    (re.compile(r"\(\s*\)|\[\s*\]"), ""),
    (re.compile(r"([;,])\s*([;,])"), r"\1"),
    (re.compile(r"[;,]\s*([).\]])"), r"\1"),
    (re.compile(r"\(\s*[;,]\s*"), "("),
    (re.compile(r"[ \t]{2,}"), " "),
]


def _scrub_etlm_inline(s: str) -> str:
    """Apply the ordered internal-token rules to one ETLM string value."""
    out = s
    for _why, pat, rep in _ETLM_INLINE_RULES:
        out = pat.sub(rep, out)
    if out == s:
        return s
    for pat, rep in _ETLM_INLINE_TIDY:
        out = pat.sub(rep, out)
    return out.strip().strip(";,").strip()


def _scrub_str(s: str) -> str:
    prev = None
    while prev != s:
        prev = s
        s = _GRP_EDITORIAL.sub("", s)
        s = _CLAUSE_EDITORIAL.sub("", s)
        s = _strip_verify(s)
        s = _strip_internal_phrases(s)
        # Internal SYSTEM tokens (workstream numbers, resolver/pipeline agent names, KB
        # event and signal ids, cycle stamps). Runs inside the fixpoint loop with the
        # rest: the rules are idempotent, so a second pass is a no-op, but a value the
        # editorial scrub rewrites first still gets seen.
        s = _scrub_etlm_inline(s)
        if _EXTRA_GRP is not None:
            s = _EXTRA_GRP.sub("", s)
            s = _EXTRA_CLAUSE.sub("", s)
    return re.sub(r"\s{2,}", " ", s).strip().rstrip(" .;,—-").strip() or s.strip()


# D5 — scrub-artifact detection. Removing an internal marker from the MIDDLE of a
# value can leave malformed copy the leak gate cannot see: it strips the forbidden
# token but a `(pending HUMAN_REVIEW)` becomes `(pending )`, still shippable and
# still wrong. Two failure shapes, both fatal (fix at source, never auto-patch — a
# cleaned `(pending)` would still reference a nonexistent entry):
#   1. a non-empty value scrubbed down to empty   (e.g. "analyst-known" → "")
#   2. a residual punctuation artifact             (empty/space-only parens or
#      brackets, or a stray space before a closing bracket)
# `space_before_close` subsumes the empty-paren/bracket cases and is the tightest
# single signal; the others are kept explicit for message clarity. Verified 0 hits
# over the current 5-ETLM bundle on 2026-07-23.
_SCRUB_ARTIFACT = re.compile(r"\(\s*\)|\[\s*\]|\S\s+[)\]]")


def find_scrub_issues(original: Any, scrubbed: Any, path: str = "") -> list[tuple[str, str, str]]:
    """Parallel-walk the post-strip original and its scrubbed copy (identical shape —
    scrub never changes keys or list length) and return (path, reason, sample) for
    every value the scrub emptied or left malformed."""
    issues: list[tuple[str, str, str]] = []
    if isinstance(scrubbed, dict):
        for k, v in scrubbed.items():
            issues += find_scrub_issues(original[k], v, f"{path}.{k}")
    elif isinstance(scrubbed, list):
        for i, v in enumerate(scrubbed):
            issues += find_scrub_issues(original[i], v, f"{path}[{i}]")
    elif isinstance(scrubbed, str):
        if original.strip() and not scrubbed.strip():
            issues.append((path, "scrub emptied a non-empty value", original[:120]))
        # The artifact check applies ONLY to a value the scrub actually changed.
        # An untouched string cannot contain an artifact the scrub introduced, and
        # checking it anyway turns authored punctuation into a false abort: obesity
        # writes "the synthesiser reading interventions[].name as the asset name",
        # whose literal "[]" tripped the empty-bracket pattern and blocked a publish
        # over prose nothing had modified. Same "tidy only what you damaged" rule the
        # markdown scrub already follows.
        elif scrubbed != original and _SCRUB_ARTIFACT.search(scrubbed):
            issues.append((path, "scrub left a punctuation artifact", scrubbed[:120]))
    return issues


def scrub_values(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: scrub_values(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [scrub_values(v) for v in obj]
    if isinstance(obj, str):
        return _scrub_str(obj)
    return obj


# D8 — internal-system-token residue gate for the ETLM VALUE surface.
#
# D5 proves the scrub did not MANGLE a value. It cannot prove the scrub actually
# REMOVED anything: a rule table that silently stopped matching — a source-side
# rewording, a regex edited to fire less, an ordering change that lets an earlier rule
# consume the anchor a later one needs — leaves every value well-formed and every gate
# green while internal system names ship. Nothing else in the pipeline sees it either:
# leak_gate() reads atlas-leak-markers.json, which is an EDITORIAL vocabulary
# (UNVERIFIED, Katie ruling, HUMAN_REVIEW) and deliberately contains no workstream
# number, so 'WS12 KB event 692' passes it today.
#
# THREE verdicts, never two:
#   RAN_CLEAN     — examined >0 values, found no residue.
#   RAN_AND_FOUND — residue; abort, naming every path so it is fixed at the rule table
#                   (or at source), never auto-patched.
#   UNGATEABLE    — examined 0 values, or the rule table is empty. Aborts with a
#                   DIFFERENT message and never reuses the pass path: a checker that
#                   examined nothing must not be readable as a pass.
#
# Deliberately strict on `cycle <n>`: every one of the 27 occurrences measured in the
# 6-code bundle on 2026-08-16 was an internal cycle stamp, none was clinical. If a
# future draft writes a genuine treatment cycle ("ORR at cycle 6"), this gate WILL
# block the sync — that is the intended review point, and the remedy is a new rule in
# _ETLM_INLINE_RULE_SPECS or a documented allowance here, not a softened gate.
_INTERNAL_TOKEN_RE = re.compile(
    r"\bWS\d+[a-z]?\b"                     # workstream system name
    r"|hr-resolver|pipeline-reconcile"     # internal agent / pipeline names
    r"|\bcycle\s?\d+\w*"                   # cycle stamps, incl. cycle49_mega
    r"|\bkb_[a-z_]+"                       # kb_event_id-style internal field refs
    r"|\bevent_ids?\s*\d+|\bsignal_ids?\s*\d+"
    r"|\bcatalyst DB\b"
    r"|\bKB\b",                            # bare knowledge-base initialism
    re.IGNORECASE,
)


def internal_token_residue(obj: Any, path: str = "") -> tuple[int, list[tuple[str, str]]]:
    """Walk a scrubbed ETLM and return (strings_examined, [(path, sample), …]).

    The examined count is the gate's denominator: it is reported on every run so a
    sweep that looked at nothing is visible as such rather than as a clean pass.
    """
    examined = 0
    found: list[tuple[str, str]] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            n, f = internal_token_residue(v, "{}.{}".format(path, k))
            examined += n
            found += f
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            n, f = internal_token_residue(v, "{}[{}]".format(path, i))
            examined += n
            found += f
    elif isinstance(obj, str):
        examined = 1
        m = _INTERNAL_TOKEN_RE.search(obj)
        if m:
            found.append((path, "{!r} in {!r}".format(m.group(0), obj[:110])))
    return examined, found


def internal_token_gate(examined: int, findings: list[tuple[str, str]], codes: int) -> None:
    """Emit the D8 verdict. Raises SyncAborted on RAN_AND_FOUND and on UNGATEABLE."""
    if not _ETLM_INLINE_RULES:
        raise SyncAborted(
            "internal-token gate DID NOT RUN (UNGATEABLE): _ETLM_INLINE_RULE_SPECS is "
            "empty, so no value-level internal-token scrub is configured. A run with no "
            "rules would report no residue for the wrong reason."
        )
    if examined == 0:
        raise SyncAborted(
            "internal-token gate DID NOT RUN (UNGATEABLE): examined 0 string values "
            f"across {codes} whitelisted code(s). That is not a pass — it means the "
            "walk found no strings, i.e. the bundle is empty or the shape changed."
        )
    if findings:
        lines = "\n".join("      {}: {}".format(p, s) for p, s in findings[:20])
        raise SyncAborted(
            f"internal-token gate RAN_AND_FOUND: {len(findings)} shipped value(s) still "
            f"carry an internal system token after the scrub (of {examined} examined "
            f"across {codes} code(s)):\n{lines}"
            + (f"\n      … and {len(findings) - 20} more" if len(findings) > 20 else "")
            + "\n  Add or correct a rule in _ETLM_INLINE_RULE_SPECS — do not relax this "
              "gate, and do not empty the value: D5 fails a value scrubbed to empty."
        )
    print(f"  ✓ internal-token gate RAN_CLEAN — {examined:,} value(s) examined across "
          f"{codes} whitelisted code(s), 0 internal system tokens surviving "
          f"({len(_ETLM_INLINE_RULES)} rules active)")


# ---------------------------------------------------------------------------
# D9 — summary-only publication.
#
# Three of the six published indications ship as a SUMMARY: enough to show the
# landscape exists and how big it is, with none of the per-row analysis. The
# reduction is done here rather than in the reader because a UI mask leaves the
# rows in the JSON, and a reader who opens devtools has the whole map. If the
# detail is meant to be private, it must not be in the bundle.
#
# What survives is deliberately the SHAPE of the work, not its content: the
# indication's identity, its epidemiology scalars, how many rows each section
# holds, and a short slice of unmet needs so the page has something to say.
# ---------------------------------------------------------------------------

SUMMARY_KEEP_SCALARS = (
    "indication", "indication_code", "icd10", "nci_thesaurus_id", "last_updated",
    "therapeutic_area",
)

def summarise_etlm(obj: dict, cfg: dict) -> dict:
    """Reduce a sanitised ETLM to a TEASER: identity, epidemiology scalars, true
    per-section counts, and the first N rows of each section.

    N rows rather than none (Katie, 2026-08-18) so the reader-side blur has real
    content to fade out, and so the deep-report route is not a dead end — it
    rendered epidemiology alone when the sections were removed outright, while the
    page still offered "read the full report" in four places.

    Still an ALLOWLIST: a section added to the schema later is absent by default
    rather than silently shipping. section_counts always carries the TRUE total, so
    the lock card can say "44 tracked · 3 shown" without the other 41 existing in
    the bundle."""
    n = int(cfg.get("etlm_summary_rows", 3))
    keep_needs = int(cfg.get("etlm_summary_unmet_needs", n))
    out: dict = {}
    for k in SUMMARY_KEEP_SCALARS:
        if isinstance(obj.get(k), (str, int, float)):
            out[k] = obj[k]

    epi = obj.get("epidemiology")
    if isinstance(epi, dict):
        out["epidemiology"] = {
            k: v for k, v in epi.items()
            if isinstance(v, (str, int, float)) and not k.endswith("_source")
        }

    # TRUE counts, computed before any slicing. Lists AND dict-shaped sections:
    # competitive_dynamics and regulatory_landscape are plain dicts of named entries,
    # so an isinstance(v, list) filter skipped them, they got no section_counts entry,
    # and the reader's WithheldSection never fired for them — the report went 3 -> 7
    # sections instead of 9. That is the original silent-drop bug one level down: a
    # section nobody counted is a section nobody can mark as withheld.
    SKIP = {"epidemiology", "section_counts"}
    counts = {k: len(v) for k, v in obj.items()
              if k not in SKIP and isinstance(v, (list, dict)) and v}
    if counts:
        out["section_counts"] = dict(sorted(counts.items()))

    # The teaser itself — first n of every list section in SUMMARY_TEASER_SECTIONS.
    for k in SUMMARY_TEASER_SECTIONS:
        v = obj.get(k)
        if isinstance(v, list) and v:
            out[k] = v[:n]

    # Benchmarks are withheld entirely — they are the analytical core, and a
    # 3-row sample of a benchmark table invites exactly the cross-trial comparison
    # the full table exists to caveat.

    # unmet_needs is withheld with the rest. It was previewed while the teaser
    # sampled every section; now that only approved therapies and pipeline assets
    # carry rows, previewing it would be the one inconsistent exception.

    out["detail_available"] = False
    out["detail_rows_shown"] = n
    out["detail_note"] = cfg.get(
        "etlm_summary_note",
        "Preview. A sample of each section is shown; the full landscape map — every "
        "approved therapy, pipeline asset, efficacy benchmark and conference readout "
        "— is available on request.",
    )
    return out


# Sections the teaser samples (Katie, 2026-08-18). Narrowed from five to two:
# epidemiology ships in full as scalars, approved therapies and pipeline assets get
# the first N rows, and EVERYTHING ELSE is withheld entirely and rendered as a
# blurred, explicitly-redacted block. Showing a sample of every section made the
# whole page feel half-published; showing two real sections and marking the rest as
# withheld reads as a deliberate preview.
SUMMARY_TEASER_SECTIONS = (
    "approved_therapies", "approved_therapies_novel", "pipeline_assets",
)


# Sections whose presence in a summary-only payload is a redaction FAILURE. Checked
# by name against what actually shipped, so a rename in the reducer cannot quietly
# turn the gate off.
# Sections that must never appear in a summary payload at ALL — the competitive and
# regulatory analysis, which is the interpretive layer rather than a row listing.
SUMMARY_FORBIDDEN = (
    "approved_therapies_legacy", "preclinical_watchlist", "novel_targets",
    "competitive_dynamics", "regulatory_landscape", "emerging_signals",
    "first_to_market_races", "allogeneic_cell_therapy_pipeline",
    "presentation_profile",
)


def summary_only_gate(out_dir: Path, summary_only: list, reduced_from: dict, cfg: dict) -> None:
    """D9 — prove the reduction happened, on the files as written.

    The assertion is now CAPPED, not ABSENT: a teaser ships the first N rows of each
    sampled section, so "the section is missing" is no longer the test. Each sampled
    section must be <= N rows AND strictly shorter than its true count wherever that
    count exceeds N. That is a stronger check than absence — it catches a reducer that
    silently stopped slicing, which an absence test would have read as "nothing to do".

    Three states, never two: a run configured to reduce that reduced nothing must not
    exit like a run that reduced everything.
    """
    asked = list(summary_only)
    if not asked:
        print("  – summary-only gate: nothing configured (all codes ship full detail)")
        return

    n = int(cfg.get("etlm_summary_rows", 3))
    missing_files, leaked, not_reduced = [], [], []
    for code in asked:
        f = out_dir / f"{code}.json"
        if not f.exists():
            missing_files.append(code)
            continue
        shipped = json.loads(f.read_text())
        counts = shipped.get("section_counts") or {}

        for key in SUMMARY_FORBIDDEN:
            if key in shipped:
                leaked.append(f"{code}.{key} — interpretive section must not ship at all")
        if shipped.get("detail_available") is not False:
            not_reduced.append(f"{code}: detail_available is not False")
        if not counts:
            not_reduced.append(f"{code}: no section_counts — the lock card cannot state what is withheld")

        # Every list that shipped must be capped, and must be a genuine reduction.
        for key, val in shipped.items():
            if not isinstance(val, list) or key == "unmet_needs_total":
                continue
            if len(val) > n:
                leaked.append(f"{code}.{key} shipped {len(val)} rows, cap is {n}")
            true_n = counts.get(key)
            if isinstance(true_n, int) and true_n > n and len(val) >= true_n:
                leaked.append(f"{code}.{key} shipped all {len(val)} of {true_n} rows — not reduced")
        # Benchmarks are dicts of named rows; same cap.
        for key, val in shipped.items():
            if key.startswith("efficacy_benchmarks") and isinstance(val, dict) and len(val) > n:
                leaked.append(f"{code}.{key} shipped {len(val)} benchmark rows, cap is {n}")

    if missing_files:
        raise SyncAborted(
            "summary-only gate DID NOT RUN (UNGATEABLE): configured for "
            f"{', '.join(missing_files)} but no shipped file was produced for them. "
            "A code named in etlm_summary_only that is not in etlm_whitelist is a "
            "configuration error, not a no-op."
        )
    if leaked or not_reduced:
        detail = "\n    ".join(leaked + not_reduced)
        raise SyncAborted(
            f"summary-only reduction FAILED for {len(leaked) + len(not_reduced)} item(s):\n"
            f"    {detail}\n"
            "  These indications ship a capped teaser deliberately. Shipping the rows and "
            "masking them in the UI is not redaction: the JSON is public."
        )

    shown = ", ".join(
        f"{c} ({sum(reduced_from.get(c, {}).values())} rows withheld)" for c in asked
    )
    print(f"  ✓ summary-only gate: {len(asked)} code(s) capped at {n} row(s)/section — {shown}")



def sync_etlms(cfg: dict[str, Any], flags: frozenset[str]) -> list[str]:
    out_dir = out() / "etlm"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    strip = set(cfg["etlm_strip_keys"])
    patterns = [re.compile(p) for p in cfg.get("etlm_strip_key_patterns", [])]
    allowed_top = set(cfg.get("etlm_allowed_top_level_keys", []))

    # D3 — resolve EVERY whitelisted source before writing anything. Previously a
    # missing source printed to stderr, `continue`d, and the sync exited 0 — with
    # that report already deleted by the rmtree above. Under D2's staging model the
    # failure would be worse, not better: an incomplete staging set gets promoted
    # atomically, i.e. the report is deleted cleanly. Fail closed instead.
    # drafts/ is the SOLE publish root (2026-08-15 ruling): one code, one path, no
    # preference order and therefore no way for the source of truth to move without a
    # config change. approved/ is NOT read here any more — it keeps its meaning as the
    # Gate C human-QC marker for WS4/WS11/WS14, which are untouched by this.
    #
    # A missing drafts/ root would resolve every code to "missing" and read as a
    # whitelist problem. It is not: publishing nothing is correct, publishing a
    # shrunken set is not, so fail before the per-code loop can misattribute it.
    if not ETLM_SRC.is_dir():
        raise SyncAborted(
            f"ETLM source root is not a directory: {ETLM_SRC} — the analyst repo is "
            "absent, unmounted or moved. Every whitelisted code would resolve to "
            "'missing'; that is an environment failure, not a whitelist one."
        )

    resolved: list[tuple[str, Path]] = []
    missing: list[str] = []
    for code in cfg["etlm_whitelist"]:
        src = ETLM_SRC / code / f"{code}.json"
        if src.exists():
            resolved.append((code, src))
        else:
            missing.append(code)
    if missing:
        raise SyncAborted(
            "ETLM source missing for whitelisted code(s): "
            + ", ".join(missing)
            + f" — expected {ETLM_SRC}/<code>/<code>.json. Publishing a shrunken set "
            "would silently delete these reports from the live site."
        )

    # D7 — gate benchmark citations on the resolved sources, before any write.
    citation_gate(resolved)
    # Runs after citation_gate and gates a DIFFERENT class: citation_gate proves a
    # source resolves, this proves the row's number agrees with the row's own text.
    # A row can pass the first and fail the second — that is the nsclc docetaxel
    # and urothelial TROPHY-U-01 defect, and neither was visible to a citation check.
    contradiction_gate(resolved)

    written: list[str] = []
    records: dict[str, Any] = {}
    # D8 accumulators — collected per code inside the loop, adjudicated once after it so
    # the verdict can report a whole-bundle denominator. Aborting after the loop is still
    # fail-closed: every write above went into STAGING, which is never promoted on a raise.
    token_examined = 0
    summary_only = list(cfg.get("etlm_summary_only", []))
    reduced_from: dict = {}
    token_findings: list[tuple[str, str]] = []
    for code, src in resolved:
        raw = src.read_bytes()
        src_sha = hashlib.sha256(raw).hexdigest()
        src_mtime = _utc_iso(src.stat().st_mtime)
        data = json.loads(raw.decode("utf-8"))
        stripped = strip_keys(data, strip, patterns)

        # D4 — strip_keys() is a DENYLIST: any top-level key that is neither stripped
        # nor deliberately allowed survives untouched into the public bundle. Assert
        # the surviving top-level keys are a subset of the sanctioned schema, so a new
        # analyst-added key fails the sync (before promotion) instead of shipping with
        # no reviewer. The remedy is a deliberate config edit either way.
        if allowed_top:
            unknown = sorted(set(stripped.keys()) - allowed_top)
            if unknown:
                raise SyncAborted(
                    f"{code}.json carries top-level key(s) that are neither allowed nor "
                    f"stripped: {', '.join(unknown)} — add each to "
                    f"etlm_allowed_top_level_keys (ship it) or etlm_strip_keys (drop it) "
                    f"in atlas-redaction-config.json. strip_keys is a denylist; an "
                    f"unclassified key ships silently."
                )

        sanitised = scrub_values(stripped)

        # D5 — the scrub must not silently mangle a value. Abort (before promotion)
        # naming the field so the analyst fixes it at source, rather than shipping
        # "(pending )" or a blanked string that later contracts read as valid.
        issues = find_scrub_issues(stripped, sanitised)
        if issues:
            lines = "\n".join(f"      {code}{p}: {why} → {sample!r}" for p, why, sample in issues[:20])
            raise SyncAborted(
                f"scrub produced {len(issues)} malformed value(s) in {code}.json — "
                f"fix the source string(s), do not auto-patch:\n{lines}"
            )

        # D9 — SUMMARY-ONLY reduction. For a code listed in etlm_summary_only, the
        # per-row detail is REMOVED FROM THE BUNDLE rather than hidden in the UI.
        #
        # Why not the UI gate: gating.ts's FULL_DETAIL_ETLM only draws a blur mask.
        # The rows still ship, so anyone can read the whole landscape out of the
        # network tab — that is a cosmetic wall, not redaction. Katie's ask was that
        # "people can't press expand all to see the details", which only holds if the
        # details are not there. So the reduction happens here, at the publish
        # boundary, and is asserted below.
        if code in summary_only:
            full_counts = _top_level_list_counts(sanitised)
            sanitised = summarise_etlm(sanitised, cfg)
            reduced_from[code] = full_counts

        # D8 — collect the internal-system-token residue for THIS code's shipped values.
        # Runs AFTER the reduction so it measures what actually ships, not what would
        # have shipped: a token living only in a removed row is not a leak.
        n_examined, n_found = internal_token_residue(sanitised, code)
        token_examined += n_examined
        token_findings += n_found

        payload = json.dumps(sanitised, indent=2)
        dst = out_dir / f"{code}.json"
        dst.write_text(payload)
        shipped_bytes = len(payload.encode("utf-8"))
        written.append(code)
        records[code] = {
            # The ROOT NAME ONLY — never a path. This file is committed to a PUBLIC
            # repo, so it must carry neither an absolute path off Katie's machine nor
            # the analyst repo's internal directory structure. An earlier version
            # stored `src.relative_to(WS_ROOT)`, which avoided the home directory but
            # still published "ws9-etlm/drafts/<code>/<code>.json" six times over.
            # source_sha256 is the integrity anchor; the path added no verification
            # power the root name does not, and leaked layout to do it.
            "source_root": "drafts" if ETLM_SRC in src.parents else "UNKNOWN",
            "source_sha256": src_sha,
            "source_mtime": src_mtime,
            "shipped_bytes": shipped_bytes,
            "top_level_list_counts": _top_level_list_counts(sanitised),
        }
        # There is only one source root now, so the old [approved]/[draft] tag would
        # print the same word every run and tell the operator nothing. These two vary
        # per run and identify the exact bytes published.
        print(f"  ok etlm/{code}.json (src sha256 {src_sha[:12]}, mtime {src_mtime}, "
              f"{shipped_bytes:,} bytes)")

    # D8 — one verdict over the whole candidate bundle, with its own denominator.
    internal_token_gate(token_examined, token_findings, len(resolved))

    # D9 — prove the summary-only reduction happened, reading the files as written
    # rather than trusting the in-memory objects the loop just built.
    summary_only_gate(out_dir, summary_only, reduced_from, cfg)

    # D6R — compare against the committed baseline BEFORE the bundle can be promoted.
    # Raises SyncAborted on a shrink or an ungateable run, so the live tree is untouched.
    print("Content-regression gate (D6R):")
    stanza = content_regression_gate(records, flags)

    # Write the record into the staged set so it is promoted and committed alongside
    # the bundle, becoming the next run's baseline.
    (out() / "_sync_provenance.json").write_text(json.dumps({
        "_doc": [
            # This file is COMMITTED TO A PUBLIC REPOSITORY. Keep the prose free of
            # source paths, directory layout and machine-local locations — an earlier
            # revision named both an author-machine path and the analyst repo's
            # internal folder structure here.
            "Publish record + content-regression baseline for the Atlas bundle.",
            "Written by the content sync; do not hand-edit.",
            "'codes': per published indication, the source root it came from, the",
            "  source sha256 and modification time, the byte size shipped, and the",
            "  length of every top-level list shipped.",
            "'content_regression_gate': the run that produced this record. The next run",
            "  refuses to ship any top-level list SHORTER than the counts above unless",
            "  it carries --allow-content-shrink, which is recorded in",
            "  shrink_acknowledged. verdict RAN_CLEAN = ran and found nothing;",
            "  BOOTSTRAP = first baseline, nothing was compared; a run that could not",
            "  compare aborts and never writes this file.",
        ],
        BASELINE_KEY: records,
        GATE_STANZA_KEY: stanza,
    }, indent=2, sort_keys=True))
    return written


# A markdown horizontal rule / section separator on its own line.
_HRULE_RE = re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$")


def _is_h1_or_h2(line: str) -> bool:
    """True for a sibling-or-higher heading, i.e. the end of an H2 section.
    '### ' is deliberately NOT a boundary — an H3 belongs to the H2 above it.
    The two tests are disjoint: '## x' does not startswith '# '."""
    return line.startswith("## ") or line.startswith("# ")


def _drop_marked_sections(lines: list[str], headings: list[str]) -> list[str]:
    """Drop each named H2 section ENTIRE — heading, body, and the '---' that
    terminated it — from the heading to the line before the next H1/H2 (or EOF).

    Exists because some internal provenance is a whole section, not a line.
    Dropping only the heading orphans its bullets under the PREVIOUS section
    (glp1's '## 10. Cross-Reference Links (WS9 ETLM)' would leave three internal
    repo-path bullets hanging off the public watch list), and the bullets often
    have no safe individual marker — adc's 'Sources Cited' nests nine
    '  - <Indication>: <etlm_key>, ...' lines whose only distinguishing feature
    is context.

    Matching is EXACT on the whole stripped line, never a substring: this
    deletes a page at a time, so it must not be able to fire on a heading it was
    never reviewed against. Consuming up to the next sibling heading also takes
    the section's own trailing separator, so the surviving '---' count stays
    right and no double rule is left behind.
    """
    if not headings:
        return lines
    wanted = set(headings)
    kept: list[str] = []
    i, n = 0, len(lines)
    while i < n:
        if lines[i].strip() in wanted:
            i += 1
            while i < n and not _is_h1_or_h2(lines[i]):
                i += 1
            continue
        kept.append(lines[i])
        i += 1
    return kept


def _trim_trailing_rules(lines: list[str]) -> list[str]:
    """Drop a trailing run of blank / horizontal-rule lines.

    D5's sibling for markdown. A separator that terminated the document's LAST
    section is a scrub artifact once that section is gone — it renders as a
    horizontal rule with nothing under it, which is shippable and wrong in the
    same way '(pending )' is. No-op on any document that still ends in content,
    which all seven whitelisted sources currently do.
    """
    end = len(lines)
    while end and (not lines[end - 1].strip() or _HRULE_RE.match(lines[end - 1])):
        end -= 1
    return lines[:end]


def _scrub_markdown(text: str, markers: list[str],
                    strip_sections: Optional[list[str]] = None) -> str:
    """Client-safe copy of a TPP/theme markdown, in three passes:

      1. drop whole internal SECTIONS named for this file (exact H2 match),
      2. drop any remaining LINE carrying an internal marker (e.g.
         'Source data:', '**Source ETLMs:**', 'Not for distribution'),
      3. strip inline provenance/workflow tokens from every surviving line.

    Passes 1 and 2 are deliberately different tools. A line-drop marker is a
    substring test against every line of every current and future whitelisted
    file, so it is only safe for a line that is pure internal provenance; an
    internal token woven into analytical prose, a table row, or a citation list
    must be handled by pass 3, since dropping that line would delete a clinical
    bullet or a page of PMIDs. TPP/theme files were previously copied verbatim —
    this closes that gap.
    """
    lines = _drop_marked_sections(text.splitlines(), strip_sections or [])
    # A marker beginning with "^" must match at the START of the line; everything else
    # stays a plain substring test. Anchoring exists because a bare substring marker is
    # a blunt instrument aimed at every current AND future tpp/theme file: "**Author:**"
    # correctly kills a standalone byline, but also matches
    # "**Drafted:** 2026-06-05 | **Author:** WS12 TPP Drafter", where dropping the line
    # would silently delete the reader-facing Drafted date. Anchor those markers instead
    # of widening them.
    anchored = [m[1:] for m in markers if m.startswith("^")]
    plain = [m for m in markers if not m.startswith("^")]
    out: list[str] = []
    for line in lines:
        if any(m in line for m in plain):
            continue
        if any(line.startswith(m) for m in anchored):
            continue
        out.append(_scrub_inline(line))
    return "\n".join(_trim_trailing_rules(out))


def sync_tpps(cfg: dict[str, Any]) -> list[str]:
    out_dir = out() / "tpp"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    markers = cfg.get("tpp_theme_strip_markers", [])
    sections = cfg.get("tpp_theme_strip_sections", {})
    written: list[str] = []
    for fname in cfg["tpp_whitelist"]:
        src = LANDSCAPE_SRC / fname
        if not src.exists():
            print(f"  ! TPP source missing: {src}", file=sys.stderr)
            continue
        slug = fname.removesuffix(".md")
        dst = out_dir / f"{slug}.md"
        dst.write_text(_scrub_markdown(src.read_text(), markers, sections.get(fname, [])))
        written.append(slug)
        print(f"  ok tpp/{slug}.md")
    return written


def sync_themes(cfg: dict[str, Any]) -> list[str]:
    out_dir = out() / "theme"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    markers = cfg.get("tpp_theme_strip_markers", [])
    sections = cfg.get("tpp_theme_strip_sections", {})
    written: list[str] = []
    for fname in cfg["theme_whitelist"]:
        src = THEMES_SRC / fname
        if not src.exists():
            print(f"  ! Theme source missing: {src}", file=sys.stderr)
            continue
        slug = fname.removesuffix(".md")
        dst = out_dir / f"{slug}.md"
        dst.write_text(_scrub_markdown(src.read_text(), markers, sections.get(fname, [])))
        written.append(slug)
        print(f"  ok theme/{slug}.md")
    return written


def _parse_h2_entries(md: str) -> list[tuple[str, list[str]]]:
    """Split a doc into (h2_heading, body_lines) entries."""
    entries: list[tuple[str, list[str]]] = []
    current: tuple[str, list[str]] | None = None
    for line in md.splitlines():
        if line.startswith("## "):
            if current is not None:
                entries.append(current)
            current = (line[3:].strip(), [])
        elif current is not None:
            current[1].append(line)
    if current is not None:
        entries.append(current)
    return entries


def _parse_h3_subsections(body: list[str]) -> list[tuple[str, list[str]]]:
    """Split entry body into (h3_heading, sub_body) subsections."""
    subs: list[tuple[str, list[str]]] = []
    current: tuple[str, list[str]] | None = None
    for line in body:
        if line.startswith("### "):
            if current is not None:
                subs.append(current)
            current = (line[4:].strip(), [])
        elif current is not None:
            current[1].append(line)
    if current is not None:
        subs.append(current)
    return subs


# Internal-token scrub for the public markdown surface (TPP, theme, ecosystem
# preview). The redaction config's tpp_theme_strip_markers drop WHOLE LINES, which
# is only ever right for a line that is pure internal provenance. These patterns
# handle the other half: an internal token sitting INSIDE a line that must survive
# — an analytical bullet, a markdown table row, a citation footer. Dropping such a
# line would delete a clinical claim or a page of PMIDs, so they are scrubbed
# in place instead.
#
# MARKDOWN ONLY. _PROVENANCE_RE, _IDPAREN_RE, _WORKFLOW_RE and _MD_REPLACEMENTS are
# reached only from _scrub_inline(); the ETLM JSON path (_scrub_str) is untouched by
# anything in this block, so a change here can never move a published JSON byte.

# Trailing "Anchor: <internal provenance>" clause.
#
# This used to be r"\s*\bAnchors?\b\s*:.*$" with re.IGNORECASE, which is a substring
# test against the ordinary English word "anchor" followed by a colon — and `.*$`
# then ate the REST OF THE LINE. It is currently shipping a truncated sentence to the
# public site: theme/adc_class_state_2026-06-05.md line 12 reads, in full,
#     - **CLDN18.2 ADC class gets its first Phase 3
# because the source says "…gets its first Phase 3 anchor:** IBI343 gastric success…".
# The leak gate cannot see this class of damage: nothing forbidden survived, the
# content simply stopped. Now anchored to the LABEL form only — capital-A "Anchor:"
# at the start of a line or immediately after a sentence end — so prose that merely
# uses the word "anchor:" keeps its sentence.
_PROVENANCE_RE = re.compile(r"(^|[.;)]\s+)\*{0,2}Anchors?\*{0,2}\s*:\s.*$")
_IDPAREN_RE = re.compile(
    r"\s*\(\s*(?:signal_id|signal_ids|event_id|event_ids|macro_signal_id)\b[^)]*\)",
    re.IGNORECASE,
)

# Workflow state tokens. Deleting these outright is what the code used to do, and it
# left ungrammatical copy on lines that must survive: "this converts to AUTO_APPLY
# for 1L HER2+ benchmark revision" became "this converts to for 1L HER2+ …", and
# "require immediate HUMAN_REVIEW chain across NSCLC" became "require immediate chain
# across NSCLC". Both shipped. The token is a machine state name, not a fact, so
# render it as ordinary English instead of removing it: the sentence keeps its shape
# and the uppercase leak-marker form (which both gates grep for verbatim) is gone.
_WORKFLOW_HYPHEN_RE = re.compile(r"\bHUMAN_REVIEW-pending\b")
_WORKFLOW_RE = re.compile(r"\b(HUMAN_REVIEW|AUTO_APPLY)\b")
_WORKFLOW_PLAIN = {"HUMAN_REVIEW": "human review", "AUTO_APPLY": "auto-apply"}

# Config-driven ordered inline replacements (atlas-redaction-config.json →
# markdown_inline_replacements). Ordered because several rules overlap: the
# end-anchored footer rules must consume their whole clause before the general
# id-reference rule can bite a piece out of it. Compiled once via
# configure_markdown_scrub(); default empty so the module imports standalone.
_MD_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = []


def configure_markdown_scrub(rules: list[dict[str, str]]) -> None:
    """Compile the config's ordered inline replacement rules.

    Each rule is {"why": …, "pattern": …, "replacement": …}. `why` is documentation
    only — it is required so no rule can enter the list without a stated reason.
    """
    global _MD_REPLACEMENTS
    compiled: list[tuple[re.Pattern[str], str]] = []
    for i, rule in enumerate(rules):
        missing = [k for k in ("why", "pattern", "replacement") if k not in rule]
        if missing:
            raise SyncAborted(
                f"markdown_inline_replacements[{i}] is missing {', '.join(missing)}. "
                "Every inline rule must carry a stated reason, a pattern and a "
                "replacement — an undocumented substitution on public copy is not "
                "reviewable."
            )
        try:
            compiled.append((re.compile(rule["pattern"]), rule["replacement"]))
        except re.error as e:
            raise SyncAborted(
                f"markdown_inline_replacements[{i}] ({rule['why']}) has an invalid "
                f"pattern {rule['pattern']!r}: {e}"
            )
    _MD_REPLACEMENTS = compiled


def _scrub_inline(line: str) -> str:
    original = line
    line = _PROVENANCE_RE.sub(r"\1", line)
    line = _IDPAREN_RE.sub("", line)
    line = _WORKFLOW_HYPHEN_RE.sub("pending human review", line)
    line = _WORKFLOW_RE.sub(lambda m: _WORKFLOW_PLAIN[m.group(1)], line)
    line = _strip_internal_phrases(line)
    if _EXTRA_GRP is not None:
        line = _EXTRA_GRP.sub("", line)
        line = _EXTRA_CLAUSE.sub("", line)
    for pat, repl in _MD_REPLACEMENTS:
        line = pat.sub(repl, line)

    # Tidy ONLY a line the scrub actually altered. The tidy exists to repair damage
    # this function caused, so running it over an untouched line can only invent
    # damage of its own: the whitespace collapse below used to reformat every line
    # in the file, flattening kras_class_trajectory's ASCII pipeline diagram (its
    # column alignment IS the content) and eating the two-space indent that makes a
    # nested markdown list nest. Untouched line in, identical line out.
    if line == original:
        return line

    line = re.sub(r",\s*\)", ")", line)
    line = re.sub(r";\s*\)", ")", line)
    line = re.sub(r"\(\s*[,;]?\s*\)", "", line)
    # A removed trailing clause can leave the sentence's own full stop stranded
    # against the previous one ("…most exposed asset.. Sacituzumab…"). Collapse
    # exactly two, never three — "…" is written as a single character here, but a
    # literal "..." must survive intact.
    line = re.sub(r"(?<!\.)\.\.(?!\.)", ".", line)
    # Collapse runs of INTERNAL whitespace only — never the leading indent, which is
    # what makes a nested markdown list nest.
    line = re.sub(r"(?<=\S)\s{2,}", " ", line)
    line = re.sub(r"\s+([.,;])", r"\1", line)
    return line.rstrip()


# --- ecosystem entry headings -------------------------------------------------
# An ecosystem H2 entry heading is NOT reader prose with an internal label attached.
# It is the source pipeline's own run-log for that cycle, shaped like:
#
#   ## 2026-08-15 (cycle171_mega — signal-gated 8-indication sweep {alopecia_areata,
#      …}). DB delta since cycle170's ceiling (event 4323 / signal 1747): 1 net-new
#      event (4324, …) + 4 net-new macro_signals (1748-1751: …). 0 AUTO_APPLY across
#      all 8 reviews; 5 HUMAN_REVIEW total … carry-forwards: sle 1 (… open since
#      cycle123) … config QC 2026-06-19 … the flagged new item fell below the retained
#      top-60 slice this pass …
#
# CLASSIFICATION: whole-unit STRIP, not a value scrub. The JSON side's rule carries
# over. A value scrub is right when an internal token is wrapped AROUND content the
# reader needs; a whole-unit strip is right when the unit is bookkeeping and nothing a
# reader needs hangs off it. Everything after the date here is bookkeeping — cycle ids,
# DB row ids (event 4323, signals 1748-1751), per-review AUTO_APPLY/HUMAN_REVIEW
# tallies, carry-forward ages measured in cycle numbers, feed internals (new_event_count,
# the retained top-60 slice), and an internal config-QC date.
#
# Value-scrubbing would also be the wrong TOOL, not merely the wrong call. This is ~2 kB
# of free-form generated prose whose wording is different every cycle, so a regex set
# tuned to today's phrasing is a bet on tomorrow's; and its residue would be an
# ungrammatical stub where a heading belongs. The date is the one fact the reader is
# owed from this unit, so the date is what ships.
#
# The cost, stated rather than hidden: the descriptor sometimes names an asset or an
# identifier in passing (cycle171's NCT07762443). That is the run-log's own summary of
# something the retained subsections state in their own words — not a citation attached
# to a clinical claim, which is the class that must never be destroyed to remove an
# internal token. No claim loses its source here, because no claim lives here.
_ENTRY_DATE_RE = re.compile(r"^\s*(\d{4}-\d{2}-\d{2})\b")

# Residue that must never survive into an EMITTED ecosystem heading, H2 or H3.
#
# This is a GATE, not a rewriter. The H2 reduction above makes an H2 leak impossible by
# construction, but H3 headings are admitted by an UNANCHORED substring match against
# ecosystem_section_whitelist and are emitted through _scrub_inline alone — and
# _scrub_inline has no rule for a cycle id. 38 distinct H3 headings in the current
# source history are admitted by that match while carrying one ('Conference observations
# (cycle37)', 'Target/modality movement (cycle37 deltas — KB scope)'). None are in
# today's retained slice; a differently-worded entry rotating in would ship them.
#
# The leak gate cannot catch this class: its vocabulary has no entry for a cycle id or a
# DB row id, and _scrub_inline deliberately rewrites HUMAN_REVIEW to 'human review',
# which is the exact string the gate greps for in uppercase. So the check has to live
# here. Aborting rather than rewriting is the point — a heading shape nobody reviewed
# should reach a human, not a regex.
_HEADING_RESIDUE = [
    ("internal cycle id", re.compile(r"\bcycle\s?\d+", re.I)),
    ("internal DB row id", re.compile(r"\b(?:event|signal|macro_signal)s?(?:_ids?)?\s+\d+", re.I)),
    ("pipeline workflow label", re.compile(r"\b(?:HUMAN_REVIEW|AUTO_APPLY)\b")),
    ("pipeline workflow label", re.compile(r"\b(?:human review|auto-apply)\b", re.I)),
    ("feed internal", re.compile(r"\bnew_event_count\b|\bstaleness[- ]floor\b|\btop-\d+\b", re.I)),
    ("internal QC reference", re.compile(r"\bconfig QC\b", re.I)),
    ("workstream name", re.compile(r"\bWS\d+\b")),
    ("internal knowledge-base reference", re.compile(r"\bKB\b")),
    ("internal session id", re.compile(r"\bS\d{2,4}\s*[—–-]")),
]


def _heading_residue(heading: str, strip_markers: list[str]) -> list[str]:
    """Every reason this heading is not safe to publish (empty = clean)."""
    found = [name for name, pat in _HEADING_RESIDUE if pat.search(heading)]
    found += [f"line-drop marker {m!r}" for m in strip_markers if m in heading]
    return found


# The same class of residue, for BODY lines. The heading path is now clean by
# construction; the body path is not, and it was never the clean half it was assumed to
# be. Measured over the reachable corpus — the 2,025 whitelisted-subsection body lines
# across all 163 source entries, any of which a future retained slice can draw from —
# the shipped scrub left 459 cycle ids, 364 DB row ids, 106 workflow labels, 3 feed
# internals and 1 config-QC reference standing. The R1/R2/R3/R5/R7 value-scrub rules
# added to atlas-redaction-config.json clear the parenthetical forms; this gate covers
# everything they deliberately do not touch.
#
# It ABORTS rather than deleting the line. These bodies are the deliverable — dense with
# trial names, ORRs, hazard ratios, NCT ids and deal values — so a blunt line-drop would
# destroy clinical content to remove an internal token, and a silent drop would hide the
# reduction. A form nobody has reviewed belongs in front of a human.
#
# Two vocabulary choices are deliberately narrow, because a gate that cries wolf gets
# removed. `top-\d+` is NOT gated: the corpus contains "top-5-oncology-via-ADC plan",
# a real business claim, so only the feed's own "top-60"/"retained top-N" slice is.
# The row-id pattern excludes a following '%' so "serious adverse events 12%" cannot be
# read as a DB id.
_BODY_RESIDUE = [
    ("internal cycle id", re.compile(r"\bcycle\s?\d+", re.I)),
    ("internal DB row id",
     re.compile(r"\b(?:macro[_ ])?(?:event|signal)s?(?:_ids?)?\s+\d+(?!\s*%)", re.I)),
    ("pipeline workflow label",
     re.compile(r"\bauto[- ]apply\b|\bhuman[ _]review\b|\bHUMAN_REVIEW\b|\bAUTO_APPLY\b", re.I)),
    ("feed internal",
     re.compile(r"\btop-60\b|\bretained top-\d+\b|\bnew_event_count\b|\bstaleness[- ]floor\b", re.I)),
    ("internal QC reference", re.compile(r"\bconfig QC\b", re.I)),
    ("workstream name", re.compile(r"\bWS\d+\b")),
]


def _body_residue(line: str) -> list[str]:
    """Every reason this body line is not safe to publish (empty = clean)."""
    return [name for name, pat in _BODY_RESIDUE if pat.search(line)]


def _entry_date_label(h2_heading: str) -> str:
    """Reduce an ecosystem H2 entry heading to its date — see the block comment above.

    Fails closed. A heading that does not open with an ISO date is a shape this
    reduction was never reviewed against, and the two alternatives are both worse than
    stopping: emitting it verbatim is precisely the defect being fixed, and inventing a
    substitute label publishes a claim about an entry nobody checked.
    """
    m = _ENTRY_DATE_RE.match(h2_heading)
    if m is None:
        raise SyncAborted(
            "an ecosystem entry heading does not begin with an ISO date, so it cannot be "
            "reduced to the one field it is allowed to publish:\n"
            f"    ## {h2_heading[:180]}\n"
            "  That heading is the source pipeline's run-log. Either the upstream heading "
            "format changed, or a line that is not an entry heading was parsed as one "
            "(_parse_h2_entries has no fenced-code-block awareness). Fix the extraction in "
            "scripts/sync-atlas-content.py — do not relax it into publishing the heading."
        )
    return m.group(1)


# sync_ecosystem verdicts. Three states, never two: a run that examined nothing must not
# exit like a run that examined everything and found it clean.
ECO_RAN_CLEAN = "RAN_CLEAN"        # parsed the note, kept ≥1 subsection, wrote the page
ECO_RAN_EMPTY = "RAN_EMPTY"        # parsed the note, kept 0 — whitelist matched nothing
ECO_DID_NOT_RUN = "DID_NOT_RUN"    # never got as far as looking: source absent/unparseable


def ecosystem_gate(report: dict[str, Any]) -> None:
    """Refuse to publish a bundle whose ecosystem page has no content.

    sync_ecosystem used to return a bool that main() dropped on the floor. A renamed
    upstream H3 heading (they are free-form — 185 distinct forms in the current source)
    would match nothing in ecosystem_section_whitelist, the page would be written with
    its header and nothing under it, the leak gate would find nothing forbidden in a file
    with no content, and the sync would exit 0 and promote it. Total content loss, no
    signal. This is the enforcement point; main() calls it on every run.
    """
    verdict = report["verdict"]
    if verdict == ECO_RAN_CLEAN:
        print(f"  ✓ ecosystem gate {verdict} — {report['subsections_kept']} subsection(s) "
              f"across {report['entries_emitted']} entry/entries; residue-checked "
              f"{report['headings_checked']} heading(s) + {report['body_lines_checked']} "
              f"body line(s); {report['marker_lines_dropped']} line(s) dropped by "
              f"ecosystem_strip_paragraph_markers")
        return
    if verdict == ECO_DID_NOT_RUN:
        raise SyncAborted(
            f"ecosystem sync DID NOT RUN (UNGATEABLE): {report['reason']}. Nothing was "
            "examined, so nothing can be certified. Previously this printed to stderr, "
            "returned a bool nobody read, and shipped a header-only page with exit 0."
        )
    raise SyncAborted(
        f"ecosystem sync RAN and kept 0 subsections: {report['reason']}. "
        f"Parsed {report['entries_in_source']} entry/entries from "
        f"{ECOSYSTEM_SRC.name}, considered {report['entries_considered']}, emitted 0.\n"
        "  This is content loss, not an empty note: the source is intact and the "
        "whitelist matched none of it. ecosystem_section_whitelist is an UNANCHORED "
        "substring match against free-form upstream H3 headings, so the usual cause is "
        "an upstream rename. Reconcile the whitelist against the current headings in "
        f"{ECOSYSTEM_SRC.name} before re-running."
    )


def sync_ecosystem(cfg: dict[str, Any]) -> dict[str, Any]:
    """Build the public ecosystem preview. Returns a REPORT the caller must gate on.

    The return value is not advisory. main() passes it to ecosystem_gate(), which
    aborts on ECO_DID_NOT_RUN and ECO_RAN_EMPTY. Nothing is written unless the run is
    ECO_RAN_CLEAN, so a header-only page cannot exist even in staging.
    """
    whitelist = [s.lower() for s in cfg["ecosystem_section_whitelist"]]
    strip_markers = cfg.get("ecosystem_strip_paragraph_markers", [])
    keep_n = int(cfg.get("ecosystem_keep_latest_n_entries", 2))

    def _report(verdict: str, reason: str, **kw: Any) -> dict[str, Any]:
        rep: dict[str, Any] = {
            "verdict": verdict,
            "reason": reason,
            "entries_in_source": 0,
            "entries_considered": 0,
            "entries_emitted": 0,
            "subsections_kept": 0,
            "headings_checked": 0,
            "body_lines_checked": 0,
            "marker_lines_dropped": 0,
        }
        rep.update(kw)
        return rep

    if not ECOSYSTEM_SRC.exists():
        return _report(ECO_DID_NOT_RUN, f"source missing at {ECOSYSTEM_SRC}")
    try:
        full = ECOSYSTEM_SRC.read_text()
    except OSError as e:
        return _report(ECO_DID_NOT_RUN,
                       f"source unreadable at {ECOSYSTEM_SRC} ({e.__class__.__name__}: {e})")

    all_entries = _parse_h2_entries(full)
    if not all_entries:
        return _report(
            ECO_DID_NOT_RUN,
            f"parsed 0 '## ' entries from {ECOSYSTEM_SRC.name} "
            f"({len(full.splitlines())} line(s) read) — the document shape changed",
        )

    # The note is append-only chronological (newest at the END). Recent cycles
    # are often thin "net-new = 0" re-fire deltas whose only subsections are
    # Watch flags / Standing observations — none whitelisted. Keep the most
    # recent keep_n entries that ACTUALLY contain a whitelisted subsection, so a
    # thin tail doesn't shut out the latest substantive entry. Fall back to the
    # raw last keep_n if nothing matches.
    def _has_whitelisted_sub(body: list[str]) -> bool:
        return any(
            any(w in h3.lower() for w in whitelist)
            for h3, _ in _parse_h3_subsections(body)
        )

    substantive = [e for e in all_entries if _has_whitelisted_sub(e[1])]
    entries = (substantive or all_entries)[-keep_n:]

    # Pass 1 — select and clean, writing nothing. The page is only assembled once the
    # run is known to have kept something, so ECO_RAN_EMPTY cannot leave a header-only
    # file behind in staging for a later step to promote.
    selected: list[tuple[str, list[tuple[str, list[str]]]]] = []
    marker_drops = 0
    for h2_heading, body in entries:
        sub_kept: list[tuple[str, list[str]]] = []
        for h3_heading, sub_body in _parse_h3_subsections(body):
            if not any(w in h3_heading.lower() for w in whitelist):
                continue
            cleaned: list[str] = []
            for line in sub_body:
                if any(marker in line for marker in strip_markers):
                    marker_drops += 1
                    continue
                cleaned.append(_scrub_inline(line))
            while cleaned and not cleaned[-1].strip():
                cleaned.pop()
            if not cleaned:
                continue
            sub_kept.append((h3_heading, cleaned))
        if sub_kept:
            selected.append((h2_heading, sub_kept))

    if not selected:
        return _report(
            ECO_RAN_EMPTY,
            "no entry in the retained slice contained a whitelisted subsection with "
            "surviving content",
            entries_in_source=len(all_entries),
            entries_considered=len(entries),
            marker_lines_dropped=marker_drops,
        )

    # Pass 2 — entry labels. Each heading collapses to its date (see _entry_date_label).
    # Two retained entries sharing a date is normal — cycle171 and cycle172 are both
    # 2026-08-15 — and two byte-identical '## 2026-08-15' headings read as a rendering
    # fault and collide as anchors. Disambiguate with a position this sync derives from
    # its own output, never with the source's cycle id.
    dates = [_entry_date_label(h2) for h2, _ in selected]
    per_date: dict[str, int] = {}
    for d in dates:
        per_date[d] = per_date.get(d, 0) + 1
    nth: dict[str, int] = {}
    labels: list[str] = []
    for d in dates:
        nth[d] = nth.get(d, 0) + 1
        labels.append(d if per_date[d] == 1 else f"{d} (entry {nth[d]} of {per_date[d]})")

    # Pass 3 — armed residue check over everything actually being published: every
    # heading (H2 and H3) and every body line. The two counters are the point. A gate
    # that examined nothing must not exit like a gate that examined everything and found
    # it clean, so both denominators are reported on every run, clean or not.
    headings_checked = 0
    body_lines_checked = 0
    residue: list[str] = []
    for label, (_, sub_kept) in zip(labels, selected):
        for level, heading in [("H2", label)] + [("H3", _scrub_inline(h)) for h, _ in sub_kept]:
            headings_checked += 1
            why = _heading_residue(heading, strip_markers)
            if why:
                residue.append(f"{level} heading '{heading[:110]}' — {', '.join(why)}")
        for _, sub_body in sub_kept:
            for line in sub_body:
                if not line.strip():
                    continue
                body_lines_checked += 1
                why = _body_residue(line)
                if why:
                    residue.append(f"body '{line.strip()[:110]}' — {', '.join(why)}")

    if headings_checked == 0 or body_lines_checked == 0:
        raise SyncAborted(
            "ecosystem residue gate DID NOT RUN (UNGATEABLE): examined "
            f"{headings_checked} heading(s) and {body_lines_checked} body line(s). "
            "A selection that produced content but presented nothing to check means the "
            "gate is wired past the content, not that the content is clean."
        )

    if residue:
        raise SyncAborted(
            f"{len(residue)} ecosystem line(s)/heading(s) carry internal residue and must "
            "not be published:\n    " + "\n    ".join(residue[:20])
            + (f"\n    … and {len(residue) - 20} more" if len(residue) > 20 else "")
            + "\n  The leak gate cannot catch this class: atlas-leak-markers.json has no "
              "entry for a cycle id or a DB row id, and _scrub_inline rewrites HUMAN_REVIEW "
              "to 'human review' — the uppercase form is the exact string that gate greps "
              "for, so the rewrite launders the token past it.\n"
              "  Fix by adding a value-scrub rule to markdown_inline_replacements that "
              "keeps the sentence (these lines carry trial names, ORRs and deal values — "
              "never drop one to remove a token), or by adjudicating the entry. This gate "
              "aborts instead of editing because an unreviewed form should reach a human."
        )

    # Pass 4 — assemble. The header states what the sync ACTUALLY does, derived from the
    # config that does it, so the two cannot drift. The old copy claimed "Internal flags
    # and PM annotations have been stripped", which was doing no work: measured over its
    # whole reachable domain — 2,025 lines of whitelisted subsection body across all 163
    # entries — ecosystem_strip_paragraph_markers drops 0 lines.
    sections = ", ".join(f"“{s}”" for s in cfg["ecosystem_section_whitelist"])
    out_lines: list[str] = [
        "# Ecosystem knowledge — preview\n",
        "_A public-safe slice of a running internal note, rebuilt by the Atlas sync._\n",
        f"_Published: the {len(selected)} most recent dated entries that carry at least one "
        f"of the sections below, each reduced to its date, and within each entry only the "
        f"subsections whose heading matches {sections}. Not published: the pipeline "
        f"run-log that heads every entry in the source note, every other subsection, and "
        f"every earlier entry. Internal record identifiers and workflow labels are removed "
        f"from the text that is kept._\n",
    ]

    kept_total = 0
    for label, (_, sub_kept) in zip(labels, selected):
        out_lines.append(f"\n## {label}\n")
        for h3_heading, sub_body in sub_kept:
            out_lines.append(f"### {_scrub_inline(h3_heading)}\n")
            out_lines.extend(sub_body)
            out_lines.append("")
            kept_total += 1

    dst = out() / "ecosystem.md"
    dst.write_text("\n".join(out_lines))
    print(f"  ok ecosystem.md ({kept_total} subsections kept across {len(selected)} entries)")
    return _report(
        ECO_RAN_CLEAN,
        "ok",
        entries_in_source=len(all_entries),
        entries_considered=len(entries),
        entries_emitted=len(selected),
        subsections_kept=kept_total,
        headings_checked=headings_checked,
        body_lines_checked=body_lines_checked,
        marker_lines_dropped=marker_drops,
    )


# Cross-link heuristics --------------------------------------------------------

# Map TPP filename → indication code by scanning the slug prefix.
INDICATION_CODES = [
    "nsclc", "obesity", "parkinsons", "breast", "crc", "mm", "pdac",
    "prostate", "hcc", "ovarian", "nhl_dlbcl", "nhl", "aml_mds", "aml",
    "gbm", "melanoma", "sclc", "thyroid", "urothelial", "alzheimers",
    "ccrcc", "gastric", "copd", "asthma", "atopic_dermatitis", "crohns_disease",
    "ankylosing_spondylitis", "autoimmune",
]


def tpp_indication(slug: str, aliases: dict[str, str]) -> str | None:
    # slug looks like tpp_<indication>_<segment>_<date>
    rest = slug[len("tpp_") :] if slug.startswith("tpp_") else slug
    # Try longest match first.
    for code in sorted(INDICATION_CODES, key=len, reverse=True):
        if rest.startswith(code + "_") or rest == code:
            return aliases.get(code, code)
    return None


def theme_indications(md: str, etlm_codes: set[str]) -> list[str]:
    # Look for explicit "Indications touched/affected" line
    match = re.search(
        r"^(?:Indications?\s*(?:touched|affected|covered)):\s*(.+)$",
        md,
        re.IGNORECASE | re.MULTILINE,
    )
    found: set[str] = set()
    if match:
        for piece in re.split(r"[,;]", match.group(1)):
            piece = piece.strip().lower().replace(" ", "_")
            if piece in etlm_codes:
                found.add(piece)
    # Also scan the first ~80 lines for indication code mentions (looser fallback).
    head = "\n".join(md.splitlines()[:80]).lower()
    for code in etlm_codes:
        if re.search(rf"\b{re.escape(code)}\b", head):
            found.add(code)
    return sorted(found)


def build_cross_links(
    cfg: dict[str, Any],
    etlms: list[str],
    tpps: list[str],
    themes: list[str],
) -> dict[str, Any]:
    aliases: dict[str, str] = cfg.get("indication_aliases", {})
    etlm_set = set(etlms)

    tpp_to_etlm: dict[str, str] = {}
    etlm_to_tpps: dict[str, list[str]] = {code: [] for code in etlms}
    for slug in tpps:
        code = tpp_indication(slug, aliases)
        if code and code in etlm_set:
            tpp_to_etlm[slug] = code
            etlm_to_tpps[code].append(slug)

    theme_to_indications: dict[str, list[str]] = {}
    etlm_to_themes: dict[str, list[str]] = {code: [] for code in etlms}
    for slug in themes:
        md_path = out() / "theme" / f"{slug}.md"
        if not md_path.exists():
            continue
        codes = theme_indications(md_path.read_text(), etlm_set)
        theme_to_indications[slug] = codes
        for code in codes:
            etlm_to_themes[code].append(slug)

    return {
        "etlm_to_tpps": etlm_to_tpps,
        "etlm_to_themes": etlm_to_themes,
        "tpp_to_etlm": tpp_to_etlm,
        "theme_to_indications": theme_to_indications,
    }


# Forbidden markers that must never appear in the shipped client bundle. The
# leak-gate greps every written file for these and fails the sync if any survive,
# so schema drift (a new internal key/token) can't silently ship again.
# Specific internal phrases (not the bare name "Katie", so the legitimate
# "© / Katie Lui sign-off" copyright byline is allowed through).
#
# The vocabulary now lives in scripts/atlas-leak-markers.json so this gate and the
# build-time TS gate (atlas-integrity-plugin.ts) share ONE list and cannot drift.
MARKERS_PATH = HERE / "atlas-leak-markers.json"
_LEAK_MARKERS: list[str] = json.loads(MARKERS_PATH.read_text())["leak_markers"]


def leak_gate(root: Path | None = None) -> list[str]:
    """Grep every shipped Atlas file for forbidden internal markers. Returns a
    list of 'file: marker → snippet' hits (empty = clean).

    `root` defaults to the live output dir. Pass a staging dir to gate a
    replacement set BEFORE it is promoted onto the live tree (see D2)."""
    hits: list[str] = []
    for path in sorted((root or DATA).rglob("*")):
        if not path.is_file() or path.suffix not in (".json", ".md"):
            continue
        text = path.read_text()
        for marker in _LEAK_MARKERS:
            idx = text.find(marker)
            if idx != -1:
                snippet = text[max(0, idx - 30) : idx + len(marker) + 30].replace("\n", " ")
                hits.append(f"{path.relative_to(REPO)}: '{marker}' → …{snippet}…")
    return hits


def verify_provenance() -> list[str]:
    """Repo-local checks on the committed D6R record. Returns failure lines (empty = ok).

    Reads only the repo (config + artifact), never WS_ROOT, so it runs in CI where the
    analyst repo does not exist. Three things make the committed bundle untrustworthy:
    the gate stanza is MISSING (the bundle predates D6R, or was promoted by something
    that skipped it), it is STALE against the current whitelist (codes were added or
    removed since, so the recorded floor does not describe what ships), or a recorded
    source path names a NON-DRAFTS root (the publish path read something other than
    the one sanctioned root).
    """
    fails: list[str] = []
    rel = SYNC_PROVENANCE.relative_to(REPO)
    try:
        whitelist = set(load_config()["etlm_whitelist"])
    except (json.JSONDecodeError, OSError, KeyError) as e:
        return [f"cannot read etlm_whitelist from {CONFIG_PATH.relative_to(REPO)}: {e}"]

    if not SYNC_PROVENANCE.exists():
        return [f"{rel} is missing — the committed bundle carries no content-regression "
                "record, so nothing proves the gate ever ran over it"]
    try:
        doc = json.loads(SYNC_PROVENANCE.read_text())
    except (json.JSONDecodeError, OSError) as e:
        return [f"{rel} unreadable: {e}"]
    if not isinstance(doc, dict):
        return [f"{rel} is not a JSON object"]

    stanza = doc.get(GATE_STANZA_KEY)
    if not isinstance(stanza, dict):
        legacy = " (this is the legacy D6 resolved_root schema)" if "resolved_root" in doc else ""
        fails.append(f"{rel} has no '{GATE_STANZA_KEY}' stanza{legacy} — DID-NOT-RUN, not a pass")
    else:
        if not isinstance(stanza.get("ran_at"), str):
            fails.append(f"{rel}: {GATE_STANZA_KEY}.ran_at missing or not a string")
        examined = stanza.get("codes_examined")
        if not isinstance(examined, int) or isinstance(examined, bool):
            fails.append(f"{rel}: {GATE_STANZA_KEY}.codes_examined missing or not an integer")
        elif examined == 0:
            fails.append(f"{rel}: {GATE_STANZA_KEY}.codes_examined is 0 — the recorded run "
                         "examined nothing and must not be read as a pass")

    codes = doc.get(BASELINE_KEY)
    if not isinstance(codes, dict):
        fails.append(f"{rel} has no '{BASELINE_KEY}' map — no baseline is recorded")
        return fails

    absent = sorted(whitelist - set(codes))
    extra = sorted(set(codes) - whitelist)
    if absent:
        fails.append(f"{rel} is stale against etlm_whitelist: no record for "
                     f"{', '.join(absent)} — whitelisted but unrecorded, so they ship ungated")
    if extra:
        fails.append(f"{rel} is stale against etlm_whitelist: records "
                     f"{', '.join(extra)}, which is no longer whitelisted")
    if isinstance(stanza, dict) and isinstance(stanza.get("codes_examined"), int) \
            and not isinstance(stanza.get("codes_examined"), bool) \
            and stanza["codes_examined"] != len(codes):
        fails.append(f"{rel}: {GATE_STANZA_KEY}.codes_examined = {stanza['codes_examined']} "
                     f"but {len(codes)} code(s) are recorded — the stanza does not describe "
                     "the record it sits in")

    expected_root = ETLM_SRC.relative_to(WS_ROOT).as_posix() + "/"
    for code in sorted(codes):
        rec = codes[code]
        if not isinstance(rec, dict):
            fails.append(f"{rel}: record for {code} is not an object")
            continue
        root = rec.get("source_root")
        if not isinstance(root, str):
            fails.append(f"{rel}: {code} has no source_root")
        elif "/" in root or root.startswith("."):
            # Belt and braces: this field is published, so it must never become a path
            # again. If someone reintroduces one, fail rather than ship it.
            fails.append(f"{rel}: {code} source_root looks like a path, not a root name: "
                         f"{root!r} — this file is public; record the root name only")
        elif root != "drafts":
            fails.append(f"{rel}: {code} was published from a NON-DRAFTS root: {root!r}. "
                         "drafts/ is the sole publish root")
    return fails


def verify_only() -> int:
    """Gate the COMMITTED tree without writing anything.

    This is what CI runs. The full sync is a local developer step that reads the
    analyst repo (absent in CI) and rewrites src/data/atlas; this mode re-reads
    what is actually committed — i.e. what actually deploys — and fails on any
    forbidden marker, and on a missing/stale/non-drafts D6R record. Without it the
    leak gate only ever ran at the discretion of whoever happened to run the sync
    locally.
    """
    print(f"Verify-only (no writes). Scanning: {DATA}")
    if not DATA.exists():
        print(f"  ✗ {DATA} does not exist", file=sys.stderr)
        return 1
    failed = False

    hits = leak_gate()
    if hits:
        failed = True
        print(f"  ✗ {len(hits)} forbidden marker(s) in the committed Atlas bundle:", file=sys.stderr)
        for h in hits[:40]:
            print(f"    - {h}", file=sys.stderr)
    else:
        scanned = sum(1 for p in DATA.rglob("*") if p.is_file() and p.suffix in (".json", ".md"))
        print(f"  ✓ clean — {scanned} shipped Atlas file(s), no forbidden internal markers")

    # Both checks always run and both report; a leak failure must not hide a
    # provenance failure, or fixing one would surface the other a build later.
    prov_fails = verify_provenance()
    if prov_fails:
        failed = True
        print(f"  ✗ {len(prov_fails)} content-provenance failure(s):", file=sys.stderr)
        for f in prov_fails:
            print(f"    - {f}", file=sys.stderr)
    else:
        print("  ✓ content-regression record present, matches etlm_whitelist, "
              "all sources under drafts/")

    return 1 if failed else 0


def main() -> int:
    try:
        flags = parse_flags(sys.argv[1:])
    except UsageError as e:
        print(f"  ✗ {e}", file=sys.stderr)
        return 2

    if "--verify-only" in flags:
        return verify_only()

    global _OUT_ROOT
    dry_run = "--dry-run" in flags

    DATA.mkdir(parents=True, exist_ok=True)
    cfg = load_config()
    configure_scrub(cfg.get("etlm_value_scrub_extra_tokens", []))
    configure_markdown_scrub(cfg.get("markdown_inline_replacements", []))

    # Build the ENTIRE replacement set in staging. Nothing under src/data/atlas is
    # touched until the gate passes.
    if STAGING.exists():
        shutil.rmtree(STAGING)
    STAGING.mkdir(parents=True, exist_ok=True)
    _OUT_ROOT = STAGING

    try:
        print(f"Sync target: {DATA}")
        print(f"Staging:     {STAGING}")
        print("ETLMs:")
        etlms = sync_etlms(cfg, flags)
        print("TPPs:")
        tpps = sync_tpps(cfg)
        print("Themes:")
        themes = sync_themes(cfg)
        print("Ecosystem:")
        # The return value is GATED, not discarded. ecosystem_gate raises SyncAborted on
        # DID_NOT_RUN and RAN_EMPTY, so a header-only ecosystem page can no longer be
        # promoted behind an exit 0.
        ecosystem_gate(sync_ecosystem(cfg))

        cross = build_cross_links(cfg, etlms, tpps, themes)
        (out() / "cross_link_map.json").write_text(json.dumps(cross, indent=2))
        print(
            f"Cross-links: tpp_to_etlm={len(cross['tpp_to_etlm'])} "
            f"theme_to_indications={len(cross['theme_to_indications'])}"
        )

        # Gate STAGING, before promotion. A failure here leaves the live tree
        # byte-identical to what was committed — nothing to revert, nothing
        # committable, no possibility of pushing rejected content.
        print("Leak gate (staging):")
        hits = leak_gate(STAGING)
        if hits:
            print(f"  ✗ {len(hits)} forbidden marker(s) in the candidate bundle — NOT promoted:", file=sys.stderr)
            for h in hits[:40]:
                print(f"    - {h}", file=sys.stderr)
            print(f"  live tree untouched: {DATA}", file=sys.stderr)
            return 1
        print("  ✓ clean — no forbidden internal markers in the candidate bundle")

        if dry_run:
            print(f"\n--dry-run: candidate bundle built and gated, NOT promoted.")
            print(f"  inspect: {STAGING}")
            return 0

        promoted = promote(STAGING)
        print(f"Promoted: {', '.join(promoted)}")
        return 0

    except SyncAborted as e:
        print(f"\n  ✗ sync aborted: {e}", file=sys.stderr)
        print(f"  live tree untouched: {DATA}", file=sys.stderr)
        return 1
    finally:
        _OUT_ROOT = DATA
        if STAGING.exists() and not dry_run:
            shutil.rmtree(STAGING, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
