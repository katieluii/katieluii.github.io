# Project Memory State

## Current Context
The public site `katieluii.github.io` (repo is PUBLIC, `has_pages=true`), served from `main` in
THIS checkout. `~/Projects/kl-portfolio-suite` is a second working copy of the same repo on
branch `claude/suite-cards` — an in-progress frontend refactor Katie will rebase onto main
herself. **Never read atlas data from the suite copy**; it lags. See memory node
`project_kl_portfolio_two_checkouts`.

`src/data/atlas/analyst_read.json` powers the `/#/ecosystem` page (note: hash route — the bare
`/ecosystem` path 404s) and is also the source WP9 drafts its daily tweet from.

## Completed
- 2026-08-19/22, commit `e1705a8` (pushed) — the weekly Monday refresh of `analyst_read.json`
  is now a job. It was a hand-made commit before.
  - `bin/run-analyst-refresh.sh` — launchd wrapper, `com.katielui.analyst-refresh`, Mondays
    07:00 (ahead of WP9's 08:30 so the week's first tweet uses fresh themes). Exports `$USER`
    for the claude keychain. Refuses to run on any branch but `main`.
  - `scripts/refresh-analyst-read.py` — distils via `claude -p`, validates deterministically,
    writes atomically, archives the prior file to `src/data/atlas/_analyst_read_history/`.
  - `src/data/atlas/source_registry.json` — controlled label→URL map. The model emits LABELS
    only; an unmapped label ships with no URL rather than a guessed one.
  - Distils from `src/data/atlas/ecosystem.md`, NOT the raw WS12 note: ecosystem.md has already
    passed the redaction whitelist and leak gate. Since WP9 turns this into a tweet, distilling
    the raw note would route internal tokens to a public page and then to X.
  - Validation refuses: not-exactly-5 narratives, unknown momentum, a model-authored URL, an
    unmapped source, thin detail, duplicate headlines. 9/9 proven both directions.
- Redaction rules extended (+1 paragraph marker `triage-fanout`, +4 inline) to close the
  leak-gate abort of 2026-08-19: an interleaved DB row-id list and the pipeline's own
  `cycleNNN_mega` run ids, neither reachable by existing R1–R7. Tested over all 6,477 lines of
  the source note: 476 lines touched, **0 losing an NCT/PMID/ORR/deal token**. Two earlier
  drafts were rejected in testing — one ate the year out of a citation, the other destroyed
  NCTs and `$600M`/`$1.5B`/`$2.6B` by dropping whole parentheticals.
- `logs/` gitignored: the repo is public and the sync's abort banner quotes the internal lines
  it rejected.
- Full chain verified under a simulated launchd env: sync clean → 5 narratives → receipt 5/5 →
  `output_assert` PASS → local commit.

## Known Issues
- **Push is OFF by default** (`ANALYST_REFRESH_PUSH=false` in the plist). The job commits
  locally and Telegrams the headlines; publishing to the public site stays a human step. Until
  someone pushes, the live page shows the prior week.
- The upstream WS12 → `ecosystem.md` sync can abort on internal residue it has no rule for
  (it did on 2026-08-19). When it does, the refresh correctly refuses to distil stale content
  and the week gets no update — a loud failure, but a failure.
- `scripts/atlas-redaction-config.json` quotes internal token examples in its `why` fields and
  is public. Pre-existing convention (8 such examples before this session added 4), noted rather
  than changed.
- The two checkouts remain diverged by design.

## Exact Next Steps
1. Watch the first unattended Monday run (07:00) and confirm the Telegram digest arrives with
   five headlines.
2. Decide whether to set `ANALYST_REFRESH_PUSH=true` for full autonomy, or keep publishing
   manual.
3. If the sync aborts again on new internal residue, the pattern to follow is in
   `~/Projects/meta_pm/reports/PROPOSED-redaction-rules-2026-08-19.md`: test any candidate rule
   across the whole source note and assert zero clinical/deal tokens lost before applying.
