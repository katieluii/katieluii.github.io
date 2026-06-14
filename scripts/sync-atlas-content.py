#!/usr/bin/env python3
"""Sync Atlas deliverables from WS9/WS12 source dirs into kl-portfolio.

Reads:
  - ~/Projects/ws9-etlm/drafts/<indication>/<indication>.json
  - ~/Projects/ws12_news_signal/landscape/tpp_*.md
  - ~/Projects/ws12_news_signal/landscape/themes/*.md
  - ~/Projects/ws12_news_signal/ecosystem_knowledge.md

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

ETLM_SRC = Path.home() / "Projects" / "ws9-etlm" / "drafts"
LANDSCAPE_SRC = Path.home() / "Projects" / "ws12_news_signal" / "landscape"
THEMES_SRC = LANDSCAPE_SRC / "themes"
ECOSYSTEM_SRC = Path.home() / "Projects" / "ws12_news_signal" / "ecosystem_knowledge.md"


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text())


def strip_keys(obj: Any, strip: set[str]) -> Any:
    if isinstance(obj, dict):
        return {k: strip_keys(v, strip) for k, v in obj.items() if k not in strip}
    if isinstance(obj, list):
        return [strip_keys(v, strip) for v in obj]
    return obj


def sync_etlms(cfg: dict[str, Any]) -> list[str]:
    out_dir = DATA / "etlm"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    strip = set(cfg["etlm_strip_keys"])
    written: list[str] = []
    for code in cfg["etlm_whitelist"]:
        # Drafts are nested as drafts/<code>/<code>.json (post-2026-06 layout);
        # fall back to the legacy flat drafts/<code>.json if present.
        src = ETLM_SRC / code / f"{code}.json"
        if not src.exists():
            src = ETLM_SRC / f"{code}.json"
        if not src.exists():
            print(f"  ! ETLM source missing: {src}", file=sys.stderr)
            continue
        data = json.loads(src.read_text())
        sanitised = strip_keys(data, strip)
        dst = out_dir / f"{code}.json"
        dst.write_text(json.dumps(sanitised, indent=2))
        written.append(code)
        print(f"  ok etlm/{code}.json ({len(json.dumps(sanitised)):,} bytes)")
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
    # The note is append-only chronological — newest is at the END, so keep the LAST keep_n.
    entries = entries[-keep_n:]

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
                cleaned.append(line)
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
