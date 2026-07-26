#!/usr/bin/env python3
"""Did the 13F holdings actually change, or only the timestamp?

The payload carries a `generated_at_utc` that moves on every run, so a plain
`git diff` on the file is always dirty. Committing on that basis produces a
commit and a full site deploy every weekday whether or not a single fund filed
anything — which is what the previous incarnation of this job did.

Compares the working-tree payload's `rows` against the committed version's.

Exit 0  -> holdings changed, worth committing and deploying.
Exit 1  -> only the timestamp moved, skip.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
REL = "public/data/stock_conc_latest.json"
OUT_JSON = APP_ROOT / REL


def rows_of(payload: dict) -> str:
    """Stable, comparable form of the part we care about."""
    return json.dumps(payload.get("rows", []), sort_keys=True, ensure_ascii=False)


try:
    new = json.loads(OUT_JSON.read_text(encoding="utf-8"))
except Exception as exc:
    # Can't read the new file at all — let the caller treat it as changed so the
    # validator (which runs first) or the commit step surfaces the problem
    # rather than this script silently swallowing it.
    print(f"could not read {REL}: {exc} — treating as changed")
    sys.exit(0)

try:
    committed_raw = subprocess.run(
        ["git", "show", f"HEAD:{REL}"],
        cwd=APP_ROOT,
        capture_output=True,
        check=True,
        text=True,
    ).stdout
    old = json.loads(committed_raw)
except Exception as exc:
    print(f"no readable committed version ({exc}) — treating as changed")
    sys.exit(0)

if rows_of(new) == rows_of(old):
    print("holdings identical to HEAD — only generated_at_utc moved, skipping commit")
    sys.exit(1)

new_rows, old_rows = new.get("rows", []), old.get("rows", [])


def quarter_map(rows: list) -> dict:
    out = {}
    for r in rows:
        if isinstance(r, dict):
            out[str(r.get("cik") or r.get("CIK"))] = r.get("as_of_quarter")
    return out


nq, oq = quarter_map(new_rows), quarter_map(old_rows)
advanced = [k for k in nq if k in oq and oq[k] != nq[k]]

print(f"holdings changed: {len(old_rows)} -> {len(new_rows)} rows")
if advanced:
    print(f"  {len(advanced)} fund(s) reporting a different quarter")
sys.exit(0)
