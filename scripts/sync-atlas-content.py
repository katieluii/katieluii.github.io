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
import re
import shutil
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
CONFIG_PATH = HERE / "atlas-redaction-config.json"
DATA = REPO / "src" / "data" / "atlas"

WS_ROOT = Path.home() / "Projects" / "ws_professional"
ETLM_SRC = WS_ROOT / "ws9-etlm" / "drafts"
ETLM_APPROVED_SRC = WS_ROOT / "ws9-etlm" / "approved"
LANDSCAPE_SRC = WS_ROOT / "ws12_news_signal" / "landscape"
THEMES_SRC = LANDSCAPE_SRC / "themes"
ECOSYSTEM_SRC = WS_ROOT / "ws12_news_signal" / "ecosystem_knowledge.md"


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text())


def strip_keys(obj: Any, strip: set[str]) -> Any:
    if isinstance(obj, dict):
        return {k: strip_keys(v, strip) for k, v in obj.items() if k not in strip}
    if isinstance(obj, list):
        return [strip_keys(v, strip) for v in obj]
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


def _scrub_str(s: str) -> str:
    prev = None
    while prev != s:
        prev = s
        s = _GRP_EDITORIAL.sub("", s)
        s = _CLAUSE_EDITORIAL.sub("", s)
    return re.sub(r"\s{2,}", " ", s).strip().rstrip(" .;,—-").strip() or s.strip()


def scrub_values(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: scrub_values(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [scrub_values(v) for v in obj]
    if isinstance(obj, str):
        return _scrub_str(obj)
    return obj


def sync_etlms(cfg: dict[str, Any]) -> list[str]:
    out_dir = DATA / "etlm"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    strip = set(cfg["etlm_strip_keys"])
    written: list[str] = []
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
            print(f"  ! ETLM source missing (approved+drafts): {code}", file=sys.stderr)
            continue
        is_approved = ETLM_APPROVED_SRC in src.parents
        data = json.loads(src.read_text())
        sanitised = scrub_values(strip_keys(data, strip))
        dst = out_dir / f"{code}.json"
        dst.write_text(json.dumps(sanitised, indent=2))
        written.append(code)
        tag = "approved" if is_approved else "draft"
        print(f"  ok etlm/{code}.json [{tag}] ({len(json.dumps(sanitised)):,} bytes)")
    return written


def sync_tpps(cfg: dict[str, Any]) -> list[str]:
    out_dir = DATA / "tpp"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    written: list[str] = []
    for fname in cfg["tpp_whitelist"]:
        src = LANDSCAPE_SRC / fname
        if not src.exists():
            print(f"  ! TPP source missing: {src}", file=sys.stderr)
            continue
        slug = fname.removesuffix(".md")
        dst = out_dir / f"{slug}.md"
        dst.write_text(src.read_text())
        written.append(slug)
        print(f"  ok tpp/{slug}.md")
    return written


def sync_themes(cfg: dict[str, Any]) -> list[str]:
    out_dir = DATA / "theme"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    written: list[str] = []
    for fname in cfg["theme_whitelist"]:
        src = THEMES_SRC / fname
        if not src.exists():
            print(f"  ! Theme source missing: {src}", file=sys.stderr)
            continue
        slug = fname.removesuffix(".md")
        dst = out_dir / f"{slug}.md"
        dst.write_text(src.read_text())
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

        out_lines.append(f"\n## {h2_heading}\n")
        for h3_heading, sub_body in sub_kept:
            out_lines.append(f"### {h3_heading}\n")
            out_lines.extend(sub_body)
            out_lines.append("")
            kept_total += 1

    dst = DATA / "ecosystem.md"
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
        md_path = DATA / "theme" / f"{slug}.md"
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


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    cfg = load_config()
    print(f"Sync target: {DATA}")
    print("ETLMs:")
    etlms = sync_etlms(cfg)
    print("TPPs:")
    tpps = sync_tpps(cfg)
    print("Themes:")
    themes = sync_themes(cfg)
    print("Ecosystem:")
    sync_ecosystem(cfg)

    cross = build_cross_links(cfg, etlms, tpps, themes)
    (DATA / "cross_link_map.json").write_text(json.dumps(cross, indent=2))
    print(
        f"Cross-links: tpp_to_etlm={len(cross['tpp_to_etlm'])} "
        f"theme_to_indications={len(cross['theme_to_indications'])}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
