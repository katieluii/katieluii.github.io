# Project Memory State

## Current Context

`katieluii.github.io` is the public portfolio. `main` and `origin/main` are at
`4138512` (`Update trial duration project description`). GitHub Pages run
`33874749164` succeeded and serves bundle `index-Piiw5Apk.js`. The deployed
bundle contains the WS21 Railway URL and the current WSi architecture copy.

The checkout contains unrelated in-progress Atlas changes and artifacts. They
were preserved and excluded from the trial-duration release. Do not sweep the
working tree into a portfolio commit.

## Completed

- Updated the trial-duration project title, summary, long description, tags and
  version explanation to describe the live v5 refit random forest,
  forest-shaped split-conformal interval and separate record-history rate model.
- Kept the Dove Clinical Trial Analyst route connected to
  `https://ws21-clinical-trial-analyst-production.up.railway.app`.
- `npm run build`, `npm run typecheck` and ESLint on the three changed files all
  passed before commit `4138512` was pushed.
- Verified the current copy and Railway URL in the deployed JavaScript bundle.

## Known Issues

- Direct project routes return HTTP 404 before the GitHub Pages SPA redirect shim
  routes them. This is expected; verify the response body or deployed bundle.
- The current working tree contains pre-existing Atlas source, data and tooling
  changes plus untracked internal state. They are outside this release.
- GitHub Actions still reports Node-version deprecation warnings in older action
  dependencies, although the Pages workflow passes.

## Exact Next Steps

1. Keep unrelated Atlas work isolated and commit it only through its own review.
2. When portfolio dependencies are next maintained, update deprecated GitHub
   action versions and re-run the Pages deployment.
3. Recheck the WS21 embed after any future Railway domain or route change.
