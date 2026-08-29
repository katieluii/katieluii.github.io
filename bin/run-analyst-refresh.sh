#!/usr/bin/env bash
# Weekly Monday refresh of the Atlas analyst read (feeds the public /#/ecosystem page
# AND WP9's daily tweet). Fires via launchd, Mondays 07:00 — before WP9's 08:30 daily.
#
# Chain: sync-atlas-content.py (WS12 -> redacted ecosystem.md) -> refresh-analyst-read.py
#        (distil + deterministic validation) -> receipt -> Telegram digest.
#
# PUSH IS OFF BY DEFAULT. The refresh commits locally and tells Katie; publishing to the
# public site stays a human step, matching the propose-only posture. Set
# ANALYST_REFRESH_PUSH=true in the plist to make it fully autonomous.
set -uo pipefail
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
# launchd sets NO $USER and the claude CLI needs it for its keychain credential (S290).
export USER="${USER:-$(id -un)}"

REPO="$HOME/Projects/kl-portfolio"
LOG="$REPO/logs/analyst-refresh.log"
JOB="com.katielui.analyst-refresh"
PUSH="${ANALYST_REFRESH_PUSH:-false}"
mkdir -p "$(dirname "$LOG")"
TS="$(date '+%Y-%m-%d %H:%M:%S')"

cd "$REPO" || { echo "[$TS] repo missing: $REPO" >> "$LOG"; exit 1; }

if [ -f "analyst-refresh-paused" ]; then
    echo "[$TS] paused (sentinel present). Skipping." >> "$LOG"; exit 0
fi

# Refuse to run on a branch that is not main — a refresh committed onto a feature
# branch is invisible to the live site and silently diverges (the two-checkout lesson).
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
if [ "$BRANCH" != "main" ]; then
    echo "[$TS] ABORT: on branch '$BRANCH', not main. Refusing to refresh." >> "$LOG"
    "$HOME/.claude/telegram-meta-notify.sh" "Analyst read refresh ABORTED" \
        "Checkout is on branch $BRANCH, not main — refusing to write the weekly read there." >/dev/null 2>&1
    exit 1
fi

echo "==== [$TS] analyst read refresh ====" >> "$LOG"

# 1. Pull WS12 -> redacted ecosystem.md. Status captured, never swallowed by a pipe.
/usr/bin/python3 scripts/sync-atlas-content.py >> "$LOG" 2>&1
SYNC_RC=$?
if [ "$SYNC_RC" -ne 0 ]; then
    echo "[$TS] sync-atlas-content failed rc=$SYNC_RC — refusing to distil stale content." >> "$LOG"
    "$HOME/.claude/telegram-meta-notify.sh" "Analyst read refresh FAILED" \
        "sync-atlas-content.py exited $SYNC_RC — the weekly read was NOT refreshed." >/dev/null 2>&1
    exit 1
fi

# 2. Distil + validate. Writes only if every deterministic check passes.
OUT="$(/usr/bin/python3 scripts/refresh-analyst-read.py 2>&1)"
REFRESH_RC=$?
echo "$OUT" >> "$LOG"

if [ "$REFRESH_RC" -ne 0 ]; then
    echo "[$TS] refresh failed rc=$REFRESH_RC" >> "$LOG"
    "$HOME/.claude/telegram-meta-notify.sh" "Analyst read refresh FAILED" \
        "refresh-analyst-read.py exited $REFRESH_RC — last week's read is still in place, nothing was overwritten." \
        "$(echo "$OUT" | tail -3)" >/dev/null 2>&1
    exit 1
fi

# "nothing to do" is a legitimate quiet run, not a delivery.
if echo "$OUT" | grep -q "nothing to do"; then
    echo "[$TS] source unchanged — no refresh needed." >> "$LOG"
    /usr/bin/python3 "$HOME/.claude/bin/job_receipt.py" write "$JOB" \
        --skipped "ecosystem.md unchanged since the last refresh" >> "$LOG" 2>&1
    exit 0
fi

# 3. Delivery receipt carrying a COUNT, never a bare timestamp.
COUNT="$(/usr/bin/python3 -c "
import json;print(len(json.load(open('src/data/atlas/analyst_read.json'))['narratives']))" 2>/dev/null || echo 0)"
/usr/bin/python3 "$HOME/.claude/bin/job_receipt.py" write "$JOB" \
    --items-in 5 --delivered "$COUNT" --note "weekly analyst read" >> "$LOG" 2>&1

# 4. Independent post-run assertion against the artifact on disk.
/usr/bin/python3 "$HOME/.claude/bin/output_assert.py" check "$JOB" >> "$LOG" 2>&1
ASSERT_RC=$?

git add src/data/atlas/analyst_read.json src/data/atlas/ecosystem.md >> "$LOG" 2>&1
if git diff --cached --quiet; then
    echo "[$TS] nothing staged — content identical." >> "$LOG"; exit 0
fi
# Commit as Katie's GitHub noreply identity so the weekly refresh is credited on her graph
# (rule of 2026-08-26: never `dev <dev@localhost>` — it matches no GitHub account).
GIT_AUTHOR_NAME="Katie Lui" GIT_AUTHOR_EMAIL="64932844+katieluii@users.noreply.github.com" \
GIT_COMMITTER_NAME="Katie Lui" GIT_COMMITTER_EMAIL="64932844+katieluii@users.noreply.github.com" \
    git commit -q -m "Atlas analyst read: weekly refresh of 5 hottest themes" >> "$LOG" 2>&1

HEADLINES="$(/usr/bin/python3 -c "
import json
d=json.load(open('src/data/atlas/analyst_read.json'))
print(' | '.join(f\"{n['momentum']}: {n['headline'][:58]}\" for n in d['narratives']))" 2>/dev/null)"

if [ "$PUSH" = "true" ]; then
    git push -q origin main >> "$LOG" 2>&1
    PUSH_RC=$?
    [ "$PUSH_RC" -eq 0 ] && STATE="pushed — live page updates on rebuild" || STATE="commit made but PUSH FAILED rc=$PUSH_RC"
else
    STATE="committed locally, NOT pushed — run: cd ~/Projects/kl-portfolio && git push"
fi

"$HOME/.claude/telegram-meta-notify.sh" "Analyst read refreshed ($COUNT themes)" \
    "$STATE" "$HEADLINES" "WP9 drafts from this at 08:30" >/dev/null 2>&1

echo "[$TS] done rc=0 assert=$ASSERT_RC push=$PUSH" >> "$LOG"
exit 0
