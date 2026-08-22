#!/usr/bin/env python3
"""Weekly Monday refresh of src/data/atlas/analyst_read.json.

WHAT IT DOES
    ecosystem.md (already redacted + leak-gated by sync-atlas-content.py)
        -> `claude -p` distils exactly 5 narratives
        -> DETERMINISTIC validation
        -> atomic write, with the previous file archived

WHY IT DISTILS FROM ecosystem.md AND NOT THE WS12 SOURCE NOTE
    `~/Projects/ws_professional/ws12_news_signal/ecosystem_knowledge.md` is the raw
    internal note. `src/data/atlas/ecosystem.md` is the same content AFTER the
    redaction whitelist and leak gate in sync-atlas-content.py. Distilling from the
    raw note would route internal tokens straight onto a public page — and, since
    WP9 drafts a daily tweet from this file, into a tweet. Always distil the gated copy.

WHY THE MODEL NEVER WRITES A URL
    It emits source LABELS only; URLs are resolved from `source_registry.json`. An
    unmapped label ships with no URL rather than a plausible guess
    (memory: feedback_llm_must_not_emit_citations).

SUBSCRIPTION, NOT API
    Uses the `claude` CLI, so it runs on the Max plan with no metered key
    (memory: feedback_no_metered_api_on_testing). launchd sets no $USER and the CLI
    needs it for its keychain credential — the wrapper exports it (S290).

EXITS
    0  refreshed, or nothing to do (source unchanged since the last refresh)
    1  refused: validation failed, model unavailable, or the source is missing
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
DATA = REPO / "src" / "data" / "atlas"
ECOSYSTEM = DATA / "ecosystem.md"
TARGET = DATA / "analyst_read.json"
REGISTRY = DATA / "source_registry.json"
ARCHIVE = DATA / "_analyst_read_history"

N_NARRATIVES = 5
MOMENTA = {"Hot", "Confirmed", "Watch"}
MAX_HEADLINE = 120
MIN_DETAIL = 120
CLAUDE_BIN = os.environ.get("CLAUDE_CLI_BIN", "claude")
MODEL = os.environ.get("ANALYST_READ_MODEL", "claude-sonnet-5")


# ---------------------------------------------------------------- source registry

def load_registry() -> tuple[dict, dict]:
    if not REGISTRY.exists():
        raise SystemExit(f"refresh: source registry missing at {REGISTRY} — refusing to guess URLs.")
    reg = json.loads(REGISTRY.read_text())
    return reg.get("sources", {}), {k: v for k, v in reg.get("patterns", {}).items() if k != "_doc"}


def resolve_source(label: str, sources: dict, patterns: dict) -> dict:
    """Label -> {label, url?}. Never invents a URL; an unknown label ships bare."""
    if label in sources:
        return {"label": label, "url": sources[label]}
    for tmpl, url_tmpl in patterns.items():
        rx = re.escape(tmpl).replace(r"\{drug\}", r"(?P<drug>[A-Za-z0-9\-]+)")
        m = re.fullmatch(rx, label)
        if m:
            return {"label": label, "url": url_tmpl.replace("{drug}", m.group("drug"))}
    return {"label": label}


# ---------------------------------------------------------------- the model call

PROMPT = """You are distilling an internal biotech ecosystem note into the "analyst's read" \
that appears on a public page: the five themes most worth knowing in drug development this week.

Return ONLY a JSON object, no prose, no code fence:

{{"intro": "<one sentence naming the five themes>",
  "narratives": [
    {{"headline": "<= {max_headline} chars, specific, no hype",
      "detail": "3-5 sentences. State the mechanism, precedent or number that makes it matter. \
Name companies and molecules where the note does.",
      "momentum": "Hot" | "Confirmed" | "Watch",
      "source_labels": ["<label>", ...]}}
  ]}}

RULES
- EXACTLY {n} narratives. Not four, not six.
- momentum: "Hot" = moving now, "Confirmed" = established this week, "Watch" = early.
- source_labels MUST come from this list, verbatim:
{labels}
  You may also use "<drug> trials (ClinicalTrials.gov)" for a drug named in the note.
- NEVER write a URL. Labels only.
- Claim NOTHING the note does not support. No invented numbers, dates or outcomes.
- No hype words: breakthrough, game-changer, revolutionary, soaring.

THE NOTE:
{note}
"""


def call_model(note: str, labels: list[str]) -> dict:
    prompt = PROMPT.format(
        n=N_NARRATIVES, max_headline=MAX_HEADLINE,
        labels="\n".join(f"  - {l}" for l in labels), note=note,
    )
    try:
        proc = subprocess.run(
            [CLAUDE_BIN, "-p", prompt, "--model", MODEL],
            capture_output=True, text=True, timeout=600,
        )
    except FileNotFoundError:
        raise SystemExit(f"refresh: `{CLAUDE_BIN}` not on PATH — the wrapper must export it.")
    except subprocess.TimeoutExpired:
        raise SystemExit("refresh: model call timed out after 600s — nothing written.")
    out = (proc.stdout or "").strip()
    # A login/usage wall prints to STDOUT and exits non-zero with empty stderr.
    if proc.returncode != 0 or not out:
        raise SystemExit(
            f"refresh: claude CLI failed (rc={proc.returncode}). "
            f"stdout[:300]={out[:300]!r} stderr[:200]={(proc.stderr or '')[:200]!r}"
        )
    m = re.search(r"\{.*\}", out, re.S)
    if not m:
        raise SystemExit(f"refresh: model returned no JSON object. stdout[:300]={out[:300]!r}")
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise SystemExit(f"refresh: model JSON did not parse ({e}). Nothing written.")


# ---------------------------------------------------------------- validation

def validate(raw: dict, sources: dict, patterns: dict) -> dict:
    """Deterministic gate. The model cannot write this file; only a passing object can."""
    errs: list[str] = []
    narratives = raw.get("narratives")
    if not isinstance(narratives, list):
        raise SystemExit("refresh: model output has no `narratives` list.")
    if len(narratives) != N_NARRATIVES:
        errs.append(f"expected exactly {N_NARRATIVES} narratives, got {len(narratives)}")

    out = []
    for i, n in enumerate(narratives, 1):
        if not isinstance(n, dict):
            errs.append(f"narrative {i} is not an object"); continue
        head, detail = (n.get("headline") or "").strip(), (n.get("detail") or "").strip()
        mom = (n.get("momentum") or "").strip()
        if not head:
            errs.append(f"narrative {i}: empty headline")
        if len(head) > MAX_HEADLINE:
            errs.append(f"narrative {i}: headline {len(head)} chars > {MAX_HEADLINE}")
        if len(detail) < MIN_DETAIL:
            errs.append(f"narrative {i}: detail only {len(detail)} chars (min {MIN_DETAIL})")
        if mom not in MOMENTA:
            errs.append(f"narrative {i}: momentum {mom!r} not in {sorted(MOMENTA)}")
        if re.search(r"https?://", f"{head} {detail}"):
            errs.append(f"narrative {i}: contains a URL — the model must not author links")
        labels = n.get("source_labels") or []
        if not isinstance(labels, list) or not labels:
            errs.append(f"narrative {i}: no source_labels")
            labels = []
        resolved = [resolve_source(str(l).strip(), sources, patterns) for l in labels]
        unmapped = [r["label"] for r in resolved if "url" not in r]
        if len(unmapped) == len(resolved) and resolved:
            errs.append(f"narrative {i}: no source label resolved to a known URL ({unmapped})")
        out.append({"headline": head, "detail": detail, "momentum": mom, "sources": resolved})

    heads = [o["headline"].lower() for o in out]
    if len(set(heads)) != len(heads):
        errs.append("duplicate headlines")

    if errs:
        raise SystemExit("refresh: REFUSED, model output failed validation:\n  - " + "\n  - ".join(errs))

    intro = (raw.get("intro") or "").strip()
    if not intro:
        raise SystemExit("refresh: no intro produced.")
    return {"updated": date.today().isoformat(), "intro": intro, "narratives": out}


# ---------------------------------------------------------------- write

def source_fingerprint() -> str:
    return hashlib.sha256(ECOSYSTEM.read_bytes()).hexdigest()[:16]


def write_atomic(payload: dict) -> None:
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    if TARGET.exists():
        prev = json.loads(TARGET.read_text()).get("updated", "unknown")
        shutil.copy2(TARGET, ARCHIVE / f"analyst_read_{prev}.json")
    fd, tmp = tempfile.mkstemp(dir=str(DATA), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, TARGET)


def main() -> int:
    ap = argparse.ArgumentParser(description="Weekly refresh of analyst_read.json")
    ap.add_argument("--dry-run", action="store_true", help="validate and print; write nothing")
    ap.add_argument("--force", action="store_true", help="refresh even if the source is unchanged")
    args = ap.parse_args()

    if not ECOSYSTEM.exists():
        print(f"refresh: source note missing at {ECOSYSTEM} — run sync-atlas-content.py first.",
              file=sys.stderr)
        return 1

    fp = source_fingerprint()
    if TARGET.exists() and not args.force:
        cur = json.loads(TARGET.read_text())
        if cur.get("source_fingerprint") == fp:
            print(f"refresh: ecosystem.md unchanged since {cur.get('updated')} (fp {fp}) — nothing to do.")
            return 0

    sources, patterns = load_registry()
    note = ECOSYSTEM.read_text(errors="ignore")
    print(f"refresh: distilling {len(note)} chars of ecosystem.md (fp {fp}) via {MODEL}…")

    payload = validate(call_model(note, sorted(sources)), sources, patterns)
    payload["source_fingerprint"] = fp
    payload["generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if args.dry_run:
        # Print it WHOLE. A truncated dry run is unreviewable — and it is exactly
        # what made the first verification unparseable (2026-08-19).
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print("\nrefresh: DRY RUN — nothing written.")
        return 0

    write_atomic(payload)
    print(f"refresh: wrote {TARGET} — {len(payload['narratives'])} narratives, updated {payload['updated']}")
    for i, n in enumerate(payload["narratives"], 1):
        print(f"  [{i}] {n['momentum']:<9} {n['headline'][:70]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
