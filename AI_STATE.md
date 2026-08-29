# Project Memory State

## Current Context
`kl-portfolio` is the working copy of `katieluii.github.io` (public site; `main.yml` deploys to
GitHub Pages on every push to `main`). The weekly Atlas analyst-read job
(`com.katielui.analyst-refresh`, Mondays 07:00) chains `scripts/sync-atlas-content.py`
(WS12/WS9 sources -> redacted `src/data/atlas/`) into `scripts/refresh-analyst-read.py`
(a headless `claude -p` distil into `analyst_read.json`).

Branch `main`, clean and pushed as of 2026-08-29. `ANALYST_REFRESH_PUSH=false` still stands:
the job commits locally and stops. Publishing remains a human step.

## Completed
- Weekly job unblocked end-to-end; last run `done rc=0 assert=0 push=false`, `output_assert PASS`.
- `scripts/sync-atlas-content.py:625` — internal-phrase scrubber widened to sibling nouns
  (precedent/convention/policy/disposition) and made greedy, so a clause is consumed through its
  LAST qualifying noun rather than stranding a dangling " rule".
- `scripts/atlas-redaction-config.json` — 10 narrow rules added across two passes. Config patterns
  compile with NO flags while the residue detector uses `re.I`; capitalised forms therefore scrubbed
  clean and still tripped the gate.
- `scripts/refresh-analyst-read.py` — bounded 3-attempt repair loop; retryable `ModelOutputError`
  so a malformed reply no longer bypasses it; `raw_decode` extraction tolerant of code fences and
  trailing prose; bad replies dumped to `logs/analyst-refresh.last-bad-reply.txt` (gitignored).
  The validation gate itself is UNCHANGED and still fails closed on exhaustion.
- Published: `432d25b..15e6517`, Pages deploy succeeded in 49s. Live bundle scanned after deploy —
  14 internal-token classes, all zero.

## Known Issues
- Headlines land at 118-119 chars against a 120 cap. The repair loop is UNIT-tested only; the live
  run passed on the model's first attempt, so it has never fired in production.
- `WS13` and `Katie` appear in the deployed JS bundle from `src/data/atlas/*.ts` comments and a label
  map. Pre-existing and unchanged by this work (`git diff` confirms), but still shipping.
- `src/data/atlas/_analyst_read_history/analyst_read_2026-08-19.json` is untracked by design.
- An ecosystem line reads "this cycle's is a duplicate ..." — pre-existing rule 55 deletes the
  sentence's subject. Cosmetic, not a gate failure.
- Each WS12 cycle can introduce a NEW internal-token shape the residue gate cannot see. Three
  separate rounds of this occurred in one session; assume it recurs.

## Exact Next Steps
1. Decide whether `ANALYST_REFRESH_PUSH` should flip to `true` in
   `~/Library/LaunchAgents/com.katielui.analyst-refresh.plist`. Evidence against: this session found
   four token classes that every CI gate passed; an auto-publish would have shipped them.
2. Before any future publish, run the three CI gates locally plus an independent token scan over
   `src/data/atlas/` — the gates alone are not sufficient:
   `npm run typecheck` ; `python3 scripts/sync-atlas-content.py --verify-only` ; `npm run build`.
3. Optional: strip `WS13` / `Katie` from the shipped bundle (source is `src/data/atlas/*.ts`).
