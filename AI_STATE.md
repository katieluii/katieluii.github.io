# Project Memory State
## Current Context
2026-11-06: Homepage update is live at https://katieluii.github.io/. Published commit: 8399654ff672430cfae96318e9c61e1a056fc945. Release branch: codex/profile-live-only-20261105. This checkout is now on codex/homepage-release-handoff-20261106 for documentation persistence without triggering another deployment.
## Completed
- Exact approved profile and AI tools/workflows paragraphs published; homepage Renascor links removed and contact email replaced with the personal address in Katie's CV. Original layout retained.
- Homepage-only source based on previously deployed 880f05b; no unrelated main-branch changes or clinical data changes included.
- Actions run 42142992752 and deployment 7589747904 succeeded. Typecheck, 56 Python tests, Atlas leak/scope checks and production build passed.
- Live asset /assets/index-83yro-KW.js verified for both paragraphs, removal of homepage Renascor labels, and personal email.
- Temporary branch deployment policy 65687864 removed. GitHub Pages again permits only main.
## Known Issues
- Main contains newer unpublished work; do not deploy it as a substitute for this homepage release.
- Existing Atlas signing authority and quarantined ledger were not modified. Their recorded production predecessor is now stale and needs reconciliation before a future Atlas release.
- The homepage-only workflow is scoped to its exact baseline and paths; this handoff adds documentation and is not a publishable copy of that release.
- Canonical checkout has unrelated changes owned by other sessions; preserved.
## Exact Next Steps
1. No further homepage work is required.
2. For a future Atlas release, reconcile the authority predecessor with deployment 7589747904 and preserve the live homepage wording.
