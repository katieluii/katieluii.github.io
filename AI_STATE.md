# Project Memory State

## Current Context

`katieluii.github.io` is the public portfolio. Branch
`claude/ws21-project-card`, `origin/main`, and the deployed GitHub Pages build
all point to `2af1a7f` as of 2026-09-02. A production workflow change now sets
the verified WS21 Railway URL and is ready to publish. The worktree's only
untracked path is `node_modules/`.

## Completed

- Preserved the existing Clinical News Monday empty-state work from `main`.
- Added Clinical Trial Analyst as a separate project under Dove, beside Trial
  Recruitment Prediction. The card identifies WSi v5 and its 80% interval,
  links to the related predictor, and falls back to an internal WIP detail page
  when `VITE_WS21_APP_URL` is absent.
- `npm run typecheck` and the production build passed before and after rebasing
  onto the latest `origin/main`.
- GitHub Pages run `33622770476` passed. Public bundle
  `index-DaWnzdvu.js` was read back and contains both Dove project ids and the
  WSi v5 copy.
- WS21 is live at
  `https://ws21-clinical-trial-analyst-production.up.railway.app`; health proves
  matching fingerprints, WSi `4efab3d`, 1,547 cells, 9,411 answers and zero
  gaps. A production build with that URL passed typecheck, 28 gate tests and
  the Atlas build gate, and contains no localhost URL.

## Known Issues

- `node_modules/` is untracked in this worktree and must not be committed.
- WS3 refresh cadence and public endpoint hardening remain separate Pending
  Katie decisions in the project tracker.

## Exact Next Steps

1. Publish the workflow change to `main`, wait for GitHub Pages, and verify the
   public Dove card opens the full WS21 interface.
2. Keep the WS3 Pending Katie decisions separate from this card.
