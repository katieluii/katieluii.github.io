# Project Memory State

## Current Context
`kl-portfolio` is the working copy of `katieluii.github.io` (public site; `main.yml` deploys to
GitHub Pages on every push to `main`). The weekly Atlas analyst-read job
(`com.katielui.analyst-refresh`, Mondays 07:00) chains `scripts/sync-atlas-content.py`
(WS12/WS9 sources -> redacted `src/data/atlas/`) into `scripts/refresh-analyst-read.py`
(a headless `claude -p` distil into `analyst_read.json`).

Branch `main`, clean and pushed as of 2026-08-29 (S311). `ANALYST_REFRESH_PUSH=false` still stands:
the job commits locally and stops. Publishing remains a human step.

2026-08-29 (S311): **the suite redesign + Bellwether are PUBLIC.** `claude/suite-cards` (S294-S295 work:
Bellwether Q2 2026 cut on Renascor tokens with data GENERATED from `public/demos/pharma-landscape.html` by
`scripts/sync-bellwether-data.mjs` under a vite build gate; suite A→E with Grid folded into Crane and Femme
moved to the archive; Edge portal v2 with conference selector; estate-wide zinc/slate→Renascor neutral remap in
`tailwind.config.js`) was rebased onto main @6121145 — only `AI_STATE.md` conflicted, main's version kept and
reconciled here — then ff-merged and pushed (`6121145..7aa1bf1`). Pages run 33272151577 deployed; the live
bundle hash equals the locally gated build and the live demo HTML is byte-identical to the commit. Worktree
`~/Projects/kl-portfolio-suite` removed and the branch deleted remote+local after a fresh-fetch containment
proof. Routing is `BrowserRouter` + `public/404.html` redirect, so deep links return HTTP 404 at the server and
still render (`/pharma-landscape`, `/demos/pharma-landscape.html#tk=SNY`).

## Completed
- S311: pre-publish gates run on the rebased tree — `npm run typecheck` 0, `sync-atlas-content.py --verify-only`
  clean (20 files), `npm run build` ✓ with `bellwether.generated.json` reproduced unchanged, `/usr/bin/grep` token
  scan over `dist/` (13 classes): only pre-existing hits (`WS13` ×1, `largecap_kb` ×1 in
  `src/data/pharmaLandscape.ts:190`, `renascor.xyz` = the contact email).
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
- Edge (E) shows **Live** while WS19 QC gates A/B/C stay ⬜ (ws19 `QC_LOG.md` line 50 records the label running
  ahead; Katie's S293 call). Edge scores only the embedded BIO 2026 list.
- `src/components/SiteLayout.tsx` is unused legacy (tree-shaken — its wrong name is not in the bundle); delete
  candidate. `/work-with-me` WS15 hub keeps its own visual identity by decision, not omission.
- `largecap_kb` (a WS6 folder name) ships in a `classifyReason` string — pre-existing, cosmetic.
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
4. Optional (deferred from S295): other product pages onto `SuitePageLayout`; delete `SiteLayout.tsx`; move
   Conference Catalyst under Edge if ruled; WS6 side wants `stanceSrc`/`stanceDate` + `marketCap` in the
   refresh SOP / D-shape before the next quarterly cut.
