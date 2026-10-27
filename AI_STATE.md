# Project Memory State
## Current Context
S368, 2026-10-27: recurring 13F refresh/verification failure repaired.
Code fixes 00907cf/a368d31 are on public main. Current handoff branch: codex/repair-13f-20261027, draft PR #1.
Canonical kl-portfolio checkout retains substantial older mixed edits; clean repair worktree is Projects/_worktrees/repair-13f-20261027.
## Completed
- Refresh no longer invokes the always-blocked site publication path. Validated data commits remain available for protected publication.
- main.yml is named Verify site (publication protected); successful verification records a clear no-deployment summary.
- Build verification run 40532491511 passed. Full 13F refresh run 40532497971 passed; holdings were unchanged, so publication_status skipped.
## Known Issues
- No site deployment occurred. New 13F data commits remain pending the protected Atlas release process; do not describe refresh success as live publication.
- Automatic approval review rejected a separate direct-main handoff push; documentation is preserved through draft PR #1 instead.
- Prior private Atlas and unrelated source changes remain outside this repair scope; pre-wrap state is preserved locally.
## Exact Next Steps
1. Review draft PR #1 for the updated handoff; do not merge unrelated canonical changes.
2. Use the protected release process for any authorized site publication.
3. Preserve existing source/release authority boundaries and the older mixed checkout.
