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

import json
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any

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
SYNC_ARTIFACTS = ["etlm", "tpp", "theme", "ecosystem.md", "cross_link_map.json"]

_OUT_ROOT: Path = DATA
STAGING = DATA.parent / ".atlas-staging"


class SyncAborted(Exception):
    """Raised when the sync must not proceed. Always raised BEFORE the live tree is
    touched, so aborting leaves src/data/atlas byte-identical to what was committed."""


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
ETLM_APPROVED_SRC = WS_ROOT / "ws9-etlm" / "approved"
LANDSCAPE_SRC = WS_ROOT / "ws12_news_signal" / "landscape"
THEMES_SRC = LANDSCAPE_SRC / "themes"
ECOSYSTEM_SRC = WS_ROOT / "ws12_news_signal" / "ecosystem_knowledge.md"


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
    re.compile(r"\s*[;,]?\s*per S\d+\b[^.\"]*?\brule\b", re.I),
    re.compile(r"\s*\(?\bNOTE-IT\b\)?", re.I),
    re.compile(r"\bHUMAN_REVIEW\b|\bAUTO_APPLY\b", re.I),
]


def _strip_internal_phrases(s: str) -> str:
    for pat in _INTERNAL_PHRASES:
        s = pat.sub("", s)
    return s


def _scrub_str(s: str) -> str:
    prev = None
    while prev != s:
        prev = s
        s = _GRP_EDITORIAL.sub("", s)
        s = _CLAUSE_EDITORIAL.sub("", s)
        s = _strip_verify(s)
        s = _strip_internal_phrases(s)
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
        elif _SCRUB_ARTIFACT.search(scrubbed):
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


def sync_etlms(cfg: dict[str, Any]) -> list[str]:
    out_dir = out() / "etlm"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    strip = set(cfg["etlm_strip_keys"])
    patterns = [re.compile(p) for p in cfg.get("etlm_strip_key_patterns", [])]

    # D3 — resolve EVERY whitelisted source before writing anything. Previously a
    # missing source printed to stderr, `continue`d, and the sync exited 0 — with
    # that report already deleted by the rmtree above. Under D2's staging model the
    # failure would be worse, not better: an incomplete staging set gets promoted
    # atomically, i.e. the report is deleted cleanly. Fail closed instead.
    resolved: list[tuple[str, Path]] = []
    missing: list[str] = []
    for code in cfg["etlm_whitelist"]:
        # PREFER the human-approved copy; fall back to the working draft.
        # Each dir uses nested <code>/<code>.json (post-2026-06 layout) with a
        # legacy flat <code>.json fallback. So moving an ETLM from drafts/ to
        # approved/ automatically promotes the published copy to the approved
        # version on the next sync, with no config change.
        candidates = [
            ETLM_APPROVED_SRC / code / f"{code}.json",
            ETLM_APPROVED_SRC / f"{code}.json",
            ETLM_SRC / code / f"{code}.json",
            ETLM_SRC / f"{code}.json",
        ]
        src = next((p for p in candidates if p.exists()), None)
        if src is None:
            missing.append(code)
        else:
            resolved.append((code, src))
    if missing:
        raise SyncAborted(
            "ETLM source missing for whitelisted code(s): "
            + ", ".join(missing)
            + " — searched approved/ then drafts/. Publishing a shrunken set would "
            "silently delete these reports from the live site."
        )

    written: list[str] = []
    for code, src in resolved:
        is_approved = ETLM_APPROVED_SRC in src.parents
        data = json.loads(src.read_text())
        stripped = strip_keys(data, strip, patterns)
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

        dst = out_dir / f"{code}.json"
        dst.write_text(json.dumps(sanitised, indent=2))
        written.append(code)
        tag = "approved" if is_approved else "draft"
        print(f"  ok etlm/{code}.json [{tag}] ({len(json.dumps(sanitised)):,} bytes)")
    return written


def _scrub_markdown(text: str, markers: list[str]) -> str:
    """Client-safe copy of a TPP/theme markdown: drop any line carrying an
    internal marker (e.g. 'Source data:', 'analyst review cycle', 'INTERNAL:')
    and strip inline provenance/workflow tokens from the rest. TPP/theme files
    were previously copied verbatim — this closes that gap."""
    out: list[str] = []
    for line in text.splitlines():
        if any(m in line for m in markers):
            continue
        out.append(_scrub_inline(line))
    return "\n".join(out)


def sync_tpps(cfg: dict[str, Any]) -> list[str]:
    out_dir = out() / "tpp"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    markers = cfg.get("tpp_theme_strip_markers", [])
    written: list[str] = []
    for fname in cfg["tpp_whitelist"]:
        src = LANDSCAPE_SRC / fname
        if not src.exists():
            print(f"  ! TPP source missing: {src}", file=sys.stderr)
            continue
        slug = fname.removesuffix(".md")
        dst = out_dir / f"{slug}.md"
        dst.write_text(_scrub_markdown(src.read_text(), markers))
        written.append(slug)
        print(f"  ok tpp/{slug}.md")
    return written


def sync_themes(cfg: dict[str, Any]) -> list[str]:
    out_dir = out() / "theme"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    markers = cfg.get("tpp_theme_strip_markers", [])
    written: list[str] = []
    for fname in cfg["theme_whitelist"]:
        src = THEMES_SRC / fname
        if not src.exists():
            print(f"  ! Theme source missing: {src}", file=sys.stderr)
            continue
        slug = fname.removesuffix(".md")
        dst = out_dir / f"{slug}.md"
        dst.write_text(_scrub_markdown(src.read_text(), markers))
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


# Internal-token scrub for the public ecosystem preview. The redaction config
# only drops whole marker lines; these patterns strip INLINE provenance/workflow
# tokens (signal_id/event_id refs, trailing "Anchor:" clauses, HUMAN_REVIEW /
# AUTO_APPLY state) that are internal/meaningless to a client reader, without
# dropping the surrounding analyst bullet.
_PROVENANCE_RE = re.compile(r"\s*\bAnchors?\b\s*:.*$", re.IGNORECASE)
_IDPAREN_RE = re.compile(
    r"\s*\(\s*(?:signal_id|signal_ids|event_id|event_ids|macro_signal_id)\b[^)]*\)",
    re.IGNORECASE,
)
_WORKFLOW_RE = re.compile(r"\b(?:HUMAN_REVIEW|AUTO_APPLY)\b")


def _scrub_inline(line: str) -> str:
    line = _PROVENANCE_RE.sub("", line)
    line = _IDPAREN_RE.sub("", line)
    line = _WORKFLOW_RE.sub("", line)
    line = _strip_internal_phrases(line)
    if _EXTRA_GRP is not None:
        line = _EXTRA_GRP.sub("", line)
        line = _EXTRA_CLAUSE.sub("", line)
    # tidy artifacts left by token removal
    line = re.sub(r",\s*\)", ")", line)
    line = re.sub(r"\(\s*,?\s*\)", "", line)
    line = re.sub(r"\s{2,}", " ", line)
    line = re.sub(r"\s+([.,;])", r"\1", line)
    return line.rstrip()


def sync_ecosystem(cfg: dict[str, Any]) -> bool:
    if not ECOSYSTEM_SRC.exists():
        print(f"  ! Ecosystem source missing: {ECOSYSTEM_SRC}", file=sys.stderr)
        return False

    full = ECOSYSTEM_SRC.read_text()
    whitelist = [s.lower() for s in cfg["ecosystem_section_whitelist"]]
    strip_markers = cfg.get("ecosystem_strip_paragraph_markers", [])
    keep_n = int(cfg.get("ecosystem_keep_latest_n_entries", 2))

    out_lines: list[str] = ["# Ecosystem knowledge — preview\n"]
    out_lines.append(
        "_A redacted, public-safe slice of the running ecosystem note. "
        "Internal flags and PM annotations have been stripped; only the most recent "
        f"{keep_n} cycle entries are shown._\n"
    )

    entries = _parse_h2_entries(full)

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

    substantive = [e for e in entries if _has_whitelisted_sub(e[1])]
    entries = (substantive or entries)[-keep_n:]

    kept_total = 0
    for h2_heading, body in entries:
        sub_kept: list[tuple[str, list[str]]] = []
        for h3_heading, sub_body in _parse_h3_subsections(body):
            if not any(w in h3_heading.lower() for w in whitelist):
                continue
            cleaned: list[str] = []
            for line in sub_body:
                if any(marker in line for marker in strip_markers):
                    continue
                cleaned.append(_scrub_inline(line))
            while cleaned and not cleaned[-1].strip():
                cleaned.pop()
            if not cleaned:
                continue
            sub_kept.append((h3_heading, cleaned))

        if not sub_kept:
            continue

        out_lines.append(f"\n## {_scrub_inline(h2_heading)}\n")
        for h3_heading, sub_body in sub_kept:
            out_lines.append(f"### {_scrub_inline(h3_heading)}\n")
            out_lines.extend(sub_body)
            out_lines.append("")
            kept_total += 1

    dst = out() / "ecosystem.md"
    dst.write_text("\n".join(out_lines))
    print(f"  ok ecosystem.md ({kept_total} subsections kept across {len(entries)} entries)")
    return kept_total > 0


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


def verify_only() -> int:
    """Gate the COMMITTED tree without writing anything.

    This is what CI runs. The full sync is a local developer step that reads the
    analyst repo (absent in CI) and rewrites src/data/atlas; this mode re-reads
    what is actually committed — i.e. what actually deploys — and fails on any
    forbidden marker. Without it the leak gate only ever ran at the discretion of
    whoever happened to run the sync locally.
    """
    print(f"Verify-only (no writes). Scanning: {DATA}")
    if not DATA.exists():
        print(f"  ✗ {DATA} does not exist", file=sys.stderr)
        return 1
    hits = leak_gate()
    if hits:
        print(f"  ✗ {len(hits)} forbidden marker(s) in the committed Atlas bundle:", file=sys.stderr)
        for h in hits[:40]:
            print(f"    - {h}", file=sys.stderr)
        return 1
    scanned = sum(1 for p in DATA.rglob("*") if p.is_file() and p.suffix in (".json", ".md"))
    print(f"  ✓ clean — {scanned} shipped Atlas file(s), no forbidden internal markers")
    return 0


def main() -> int:
    if "--verify-only" in sys.argv:
        return verify_only()

    global _OUT_ROOT
    dry_run = "--dry-run" in sys.argv

    DATA.mkdir(parents=True, exist_ok=True)
    cfg = load_config()
    configure_scrub(cfg.get("etlm_value_scrub_extra_tokens", []))

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
        etlms = sync_etlms(cfg)
        print("TPPs:")
        tpps = sync_tpps(cfg)
        print("Themes:")
        themes = sync_themes(cfg)
        print("Ecosystem:")
        sync_ecosystem(cfg)

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
