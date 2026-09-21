# Project Memory State

## Current Context

2026-09-21 — Edge Jefferies candidate is complete on isolated branch
`codex/jefferies-demo-20260921`; the shared dirty `main` checkout was not changed.
Jefferies London 2026 is the default dataset with all 330 company entries and
899 published attendee records from the 11-page public roster pulled on
21 September 2026. Seven company entries publish no attendee names and are
labelled accordingly. BIO 2026 remains selectable with its original 1,654
exhibitors. Dataset tests, TypeScript, production build and local browser
acceptance all pass, including attendee display and Jefferies/BIO round-trip.
Public deployment is not complete: the ordinary Pages workflow is intentionally
fail-closed, while the enrolled protected authority expired on 20 September and
is bound to commit `880f05b` and the safe-unpublished operation. Do not bypass
that release boundary; renew an exact-commit authority package before publishing.

2026-09-14 — Reader cleanup: Planned badges and the requested metadata/disclaimer blocks
removed. Five analyst themes retained with ten reviewed article links; financing corrected
to the source-backed $275M round and unsupported market-wide/internal-review wording removed.
Refresh validation rejects publisher hubs and search links.45 tests, typecheck, publication
verification and build pass. This release changes no clinical map or publication status;
the separate six-map refresh and new indication batches remain under review.

2026-09-14 — scoped release hardening: dependencies now audit clean (zero all/runtime
vulnerabilities); Vite 6.4.3 and compatible plugin/router updates pass typecheck, 42 Python
tests, public verify-only and build. Four observed workflow-clause leaks have scrub and
mutation coverage. Six generated maps remain WITHHELD: independent review found additional
process prose and clinical evidence issues. Existing 134 amber warnings include a public
projection defect: endpoint provenance/gap metadata is stripped; do not clear flags blindly.
The shared private/frontend/data work is preserved. Publish only the reviewed code commits.

`katieluii.github.io` is the public portfolio. Local `main` is at `66dcd69`
(`Harden Atlas public-copy provenance scrub`) and has diverged from `origin/main`
(ahead one, behind one). Do not rebase the shared checkout while the active Atlas
session owns its in-progress changes. GitHub Pages run `33874749164` succeeded
and serves bundle `index-Piiw5Apk.js`; it contains the WS21 Railway URL and the
current WSi architecture copy.

The checkout contains unrelated in-progress Atlas changes and artifacts. They
were preserved and excluded from the trial-duration release. Do not sweep the
working tree into a portfolio commit.

## Completed

- The Atlas public-copy sync now removes seven documented workflow-provenance
  residues without removing citations or clinical claims. The rules cover cycle
  stamps, internal routing paths, local corpus-search commands, feed-event
  bookkeeping, and session labels.
- `python3 -m unittest scripts.tests.test_sync_gates -v` passed 29 tests. A full
  staged sync passed citation, contradiction, D8 (23,585 strings examined),
  content-regression, summary, ecosystem, and leak gates with zero D8 residue.
- Commit `66dcd69` contains only the scrub rules and their regression test.
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
- The live analyst refresh is intentionally deferred until the active Atlas
  session has finalized its generated output. No affirmative receipt was written
  for the earlier D8 failure.
- GitHub Actions still reports Node-version deprecation warnings in older action
  dependencies, although the Pages workflow passes.

## Exact Next Steps

1. Finish and commit the active Atlas work, then run
   `com.katielui.analyst-refresh` and verify its fresh receipt and output assertion.
2. Reconcile local `main` with `origin/main` only after the shared Atlas checkout
   is clean and its owner has approved the integration.
3. When portfolio dependencies are next maintained, update deprecated GitHub
   action versions and re-run the Pages deployment.
4. Recheck the WS21 embed after any future Railway domain or route change.
