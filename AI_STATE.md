# Project Memory State

## Current Context

`katieluii.github.io` is the public portfolio. Branch
`claude/ws21-project-card` and `origin/main` contain production commit
`7805ae8` as of 2026-09-02. GitHub Pages run `33624892214` passed and deployed
the verified WS21 Railway URL. The worktree's only untracked path is
`node_modules/`.

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

1. Keep the WS3 Pending Katie decisions separate from this card.
