#!/usr/bin/env python3
"""Fail-closed gate on the generated 13F payload.

Runs between the scraper and the commit. The scraper talks to a live SEC
endpoint over 140 CIKs, so a partial outage, a throttle, or a schema change at
the other end can leave a file that is syntactically valid JSON and completely
useless. Committing that would deploy it to the live site and overwrite the last
good snapshot.

Exits non-zero on anything that should not reach the site. Non-zero here stops
the workflow before `git commit`, so the previous good data stays deployed.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = APP_ROOT / "public" / "data" / "stock_conc_latest.json"

# The scraper's own CIK list length. If the payload has far fewer rows than
# funds requested, SEC was throttling us and the run is not representative.
MIN_ROWS = 100

# A quarter more than one full quarter stale means we are serving old data and
# should be told, not silently deploy it.
QUARTER_RE = re.compile(r"^(\d{4})Q([1-4])$")

failures: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


if not OUT_JSON.exists():
    print(f"FAIL: {OUT_JSON} does not exist — the scraper wrote nothing.")
    sys.exit(1)

raw = OUT_JSON.read_text(encoding="utf-8")

try:
    payload = json.loads(raw)
except json.JSONDecodeError as exc:
    print(f"FAIL: {OUT_JSON} is not valid JSON: {exc}")
    sys.exit(1)

# NaN/Infinity are accepted by Python's json but are NOT valid JSON and will
# throw in the browser's JSON.parse, blanking the dashboard.
if re.search(r"\b(NaN|Infinity|-Infinity)\b", raw):
    fail("payload contains NaN/Infinity — invalid JSON, browser JSON.parse will throw")

rows = payload.get("rows")
if not isinstance(rows, list):
    print("FAIL: payload has no 'rows' list.")
    sys.exit(1)

if len(rows) < MIN_ROWS:
    fail(f"only {len(rows)} rows (expected >= {MIN_ROWS}) — likely a throttled/partial run")

generated = payload.get("generated_at_utc")
if not generated:
    fail("payload has no generated_at_utc")

# Every row should carry the quarter it represents; that is the whole point of
# the dashboard claiming to show "latest quarterly available data".
quarters: list[str] = []
missing_quarter = 0
for row in rows:
    if not isinstance(row, dict):
        fail("a row is not an object")
        break
    q = row.get("as_of_quarter")
    if isinstance(q, str) and QUARTER_RE.match(q):
        quarters.append(q)
    else:
        missing_quarter += 1

if not quarters:
    fail("no row carries a parseable as_of_quarter — cannot state which quarter this is")
else:
    # Some funds file late or not at all; a few blanks are normal, most blank is not.
    blank_share = missing_quarter / len(rows)
    if blank_share > 0.5:
        fail(f"{missing_quarter}/{len(rows)} rows have no as_of_quarter ({blank_share:.0%})")
    elif missing_quarter:
        warn(f"{missing_quarter}/{len(rows)} rows have no as_of_quarter (late/non-filers)")

    newest = max(quarters, key=lambda s: (int(s[:4]), int(s[-1])))
    now = datetime.now(timezone.utc)
    cur_q = (now.month - 1) // 3 + 1
    # Filings land up to 45 days after quarter end, so the newest available
    # quarter is normally the previous one. Two behind means something stalled.
    lag = (now.year - int(newest[:4])) * 4 + (cur_q - int(newest[-1]))
    if lag > 2:
        fail(f"newest quarter in payload is {newest}, {lag} quarters behind {now.year}Q{cur_q}")
    print(f"  newest quarter present: {newest} (current {now.year}Q{cur_q}, lag {lag})")

print(f"  rows: {len(rows)}")
print(f"  generated_at_utc: {generated}")
print(f"  bytes: {len(raw)}")

for w in warnings:
    print(f"WARN: {w}")

if failures:
    for f in failures:
        print(f"FAIL: {f}")
    print(f"\n{len(failures)} check(s) failed — refusing to commit; last good data stays live.")
    sys.exit(1)

print("\nOK — payload passed all gates.")
