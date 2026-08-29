# Project Memory State

## Current Context
`kl-portfolio` is the working copy of `katieluii.github.io` (public site; `main.yml` deploys to
GitHub Pages on every push to `main`). The weekly Atlas analyst-read job
(`com.katielui.analyst-refresh`, Mondays 07:00) chains `scripts/sync-atlas-content.py`
(WS12/WS9 sources -> redacted `src/data/atlas/`) into `scripts/refresh-analyst-read.py`
(a headless `claude -p` distil into `analyst_read.json`).

Branch `main`, clean and pushed as of 2026-08-29 (S311). `ANALYST_REFRESH_PUSH=false` still stands:
the job commits locally and stops. Publishing remains a human step.

**Suite redesign (2026-08-29): merged + live, the estate-wide restyle was reverted (`7264293`) and then RE-APPLIED the same evening — Katie
committed to the redesign; the house palette is estate-wide again.** `claude/suite-cards` went live at 20:56 (`c247a64..7aa1bf1`, pushed by the
Bellwether S295 session). Branch `claude/projects-filters` then (1) turned the /projects Suite/Theme/Status
chip rows into three labelled dropdowns (`FilterSelect` in `Projects.tsx`; `FilterChips.tsx` now unused),
(2) added `atlas-drug-dev-analyst` to Atlas's `madeOf` so the Atlas page tags as suite A, and (3) briefly reverted the six
style files of `7aa1bf1` (`7264293`), reversed by the next commit. Net: everything from `7aa1bf1` is live —
the `zinc`/`slate`/`white` remap in `tailwind.config.js`, `var(--bg)` grounds in the layouts, Home,
Bellwether and the A–E suite. Edge and Bellwether are being edited in OTHER sessions —
they must rebase on main before merging.

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

- Suite A→E + Crane fold + Femme archive + Home copy/buttons — live. Estate-wide retheme live (reverted then re-applied 2026-08-29).
- /projects filters as dropdowns; Atlas analyst page in suite A (claude/projects-filters).
- Dark-mode audit 2026-08-29 (headless Chrome, 15 routes light+dark, `.dark` forced): home, /projects and
  all 11 product pages render clean on the green-deep ground; only deliberate bone panels remain (Edge's
  embedded portal, the IC-memo card). `/work-with-me` blank is BY DESIGN (`WWM_LIVE=false`).

## Known Issues
- **Dark theme is not applied on direct loads of /projects or the 19 `ProjectPageLayout` pages.** The
  only thing that adds `.dark` to `<html>` is `ThemeToggle`'s effect, and it mounts only in `Home` and
  `SuitePageLayout`. Refreshing a product page with `localStorage.theme=dark` renders light; the stored
  theme only reaches those pages via client-side navigation. Fix = one inline `<script>` in `index.html`
  head (`if(localStorage.theme==='dark')document.documentElement.classList.add('dark')`) — also removes
  the flash. Not yet applied.
- Edge shows **Live** while WS19's own QC gates A/B/C are still open (ws19 `QC_LOG.md`).
- Edge scores only the embedded BIO 2026 list (pulled 2026-06-21); JPM/BioEquity need delegate exports.
- `SiteLayout.tsx` is unused legacy with a wrong name inside; candidate for deletion.
- The `zinc`/`slate` remap changes any FUTURE use of those classes too (intended).
- Conference Catalyst sits under Atlas, not Edge; A/D/E suite copy still awaits the owner's own edits.
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
- ~~Each WS12 cycle can introduce a NEW internal-token shape the residue gate cannot see.~~
  **Upstream gate now exists (WS12 `d2991e28`, 2026-08-29):** `scouts/ecosystem_residue.py` imports
  THIS script by path (`load_config`, `configure_*`, `_parse_h2_entries`, `_parse_h3_subsections`,
  `_scrub_inline`, `_heading_residue`, `_body_residue`, `_entry_date_label`, `_INTERNAL_TOKEN_RE`,
  `ECOSYSTEM_SRC`) and refuses to run if any is missing — renaming one of those breaks the WS12
  mega-cycle stage loudly (exit 2), by design. It adds an identifier-shape novelty net and found 5
  leaks on 12 shipping lines that this gate reported CLEAN. The Monday sync is no longer the first
  detector; it remains the last.
- `_BODY_RESIDUE` row-id pattern (`sync-atlas-content.py:1884`): the `(?!\s*%)` lookahead is
  defeated by `\d+` backtracking to a shorter match, so "serious adverse events 12%" is read as a
  DB row id and would abort the sync. Latent (no shipped line has hit it yet). One-line fix
  `\d+\b(?!\s*%)` plus a regression test with that exact sentence; measure with WS12's
  `python3 -m scouts.ecosystem_residue --measure` before and after.

## Exact Next Steps
1. Decide whether `ANALYST_REFRESH_PUSH` should flip to `true` in
   `~/Library/LaunchAgents/com.katielui.analyst-refresh.plist`. Evidence against: S310 found
   four token classes that every CI gate passed; an auto-publish would have shipped them.
   **S311 recommendation (2026-08-29): keep false until (a) the independent token scan is a scripted
   fail-closed stage inside the job and (b) the WS12 emit gate has run 3 consecutive weekly cycles
   with the manual scan finding nothing the job didn't. Middle path: push to a `claude/analyst-refresh`
   branch so CI runs without deploying** — wrapper branch-target support unverified.
2. Before any future publish, run the three CI gates locally plus an independent token scan over
   `src/data/atlas/` — the gates alone are not sufficient:
   `npm run typecheck` ; `python3 scripts/sync-atlas-content.py --verify-only` ; `npm run build`.
3. Optional: strip `WS13` / `Katie` from the shipped bundle (source is `src/data/atlas/*.ts`).
4. Optional (deferred from S295): other product pages onto `SuitePageLayout`; delete `SiteLayout.tsx`; move
   Conference Catalyst under Edge if ruled; WS6 side wants `stanceSrc`/`stanceDate` + `marketCap` in the
   refresh SOP / D-shape before the next quarterly cut.
4. Apply the 3-line dark-theme bootstrap in `index.html` (see Known Issues), rebuild, re-shoot /projects
   dark on a direct load, then branch → merge → push.
5. Optional: delete `SiteLayout.tsx`; move Conference Catalyst under Edge; restyle `/work-with-me` (WS15,
   own Fraunces identity) onto the Renascor tokens.
