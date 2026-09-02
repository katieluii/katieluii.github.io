# Project Memory State

## Current Context

`katieluii.github.io` is the public portfolio. `main` and `origin/main` are both
at `aaf6f6d` (2026-09-03), fast-forward only, no open feature branches from this
session. GitHub Pages run `33696153682` succeeded and serves bundle
`index-DWYEF7Hv.js`. The single ground-truth checkout is
`~/Projects/kl-portfolio`; `~/Projects/_worktrees/kl-portfolio-ws21-card` still
exists on branch `claude/ws21-project-card`, whose commit is already contained
in `main`.

## Completed

- Rewrote all five suite card `job` lines in `src/data/suite.ts` so each opens by
  naming the analyst the product stands in for: drug development (Atlas, 203
  chars), pharma ER (Bellwether, 133), biotech VC (Crane, 126), clinical trial
  (Dove, 138), BD (Edge, 131).
- Raised the clamp on that line in `src/components/SuiteLedger.tsx:77` from
  `line-clamp-3 sm:line-clamp-2` to `line-clamp-5 sm:line-clamp-3`, so Atlas's
  full sentence renders. The clamp caps height rather than setting it, so the
  four shorter cards are visually unchanged.
- Three commits, each typechecked, deployed and read back from the live bundle:
  `c58f8f5` (first shortening pass), `b8e8c1f` (Dove covering WSi v5 + WS21),
  `aaf6f6d` (analyst voice + clamp). All five strings confirmed present in
  `index-DWYEF7Hv.js`; the superseded copy returns zero matches.
- Confirmed WS21 reached production independently of this session: `2af1a7f`,
  `7805ae8` and `e8ebf63` are on `main`, and `VITE_WS21_APP_URL` is set in
  `.github/workflows/main.yml:25` to the Railway URL, so Dove and the WS21
  project page both resolve as Live.

## Known Issues

- A deep link on this site returns HTTP 404 by design. `/projects`,
  `/atlas-drug-dev-analyst` and every other route do the same, because
  `public/404.html` is the GitHub Pages SPA redirect shim. Never read the status
  code as evidence a page was not deployed; read the served body or the bundle.
- `src/data/atlas/_sync_provenance.json` carries two machine-written `ran_at`
  timestamps as an uncommitted local change, and
  `src/data/atlas/_analyst_read_history/analyst_read_2026-08-19.json` and
  `..._2026-08-25.json` are untracked. None belong to this session's work; they
  were stashed and restored around each commit and must not be swept in.
- CI warns that `actions/checkout@v4`, `setup-node@v4` and `upload-artifact@v4`
  are forced onto Node 24 because Node 20 is deprecated on GitHub runners.
  Deploys still pass.

## Exact Next Steps

1. View the home page at desktop and mobile width and confirm no card row
   truncates mid-sentence with the new clamp.
2. Decide whether the three action versions above should be bumped to `@v5`
   before the Node 20 runners are withdrawn.
3. Leave `~/Projects/_worktrees/kl-portfolio-ws21-card` and its branch alone
   unless a parallel session has finished with them; the branch adds nothing to
   `main`.
