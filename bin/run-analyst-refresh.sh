#!/usr/bin/env bash
# launchd's weekly public Atlas refresh. Review is the default; publishing is separate.
set -euo pipefail
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export USER="${USER:-$(id -un)}"

REPO="${ANALYST_REFRESH_REPO:-$HOME/Projects/kl-portfolio}"
PYTHON="${ANALYST_REFRESH_PYTHON:-/usr/bin/python3}"
RECEIPT="${ANALYST_REFRESH_RECEIPT:-$HOME/.claude/bin/job_receipt.py}"
ASSERT="${ANALYST_REFRESH_ASSERT:-$HOME/.claude/bin/output_assert.py}"
LOG="$REPO/logs/analyst-refresh.log"
JOB="com.katielui.analyst-refresh"
REVIEW="${ANALYST_REFRESH_REVIEW:-true}"
PUSH="${ANALYST_REFRESH_PUSH:-false}"
NOTIFY="${ANALYST_REFRESH_NOTIFY:-false}"
RUN_ID="$(date -u '+%Y%m%dT%H%M%SZ')-$$"
PHASE=preflight
mkdir -p "$(dirname "$LOG")"
exec >> "$LOG" 2>&1

finish() {
    rc=$?
    trap - EXIT
    if [ "$rc" -ne 0 ]; then
        "$PYTHON" "$RECEIPT" write "$JOB" --items-in 5 --delivered 0 \
            --note "run=$RUN_ID FAILED phase=$PHASE rc=$rc" || true
    fi
    echo "[$RUN_ID] done rc=$rc phase=$PHASE review=$REVIEW push=$PUSH"
    exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for flag in "$REVIEW" "$PUSH" "$NOTIFY"; do
    case "$flag" in true|false) ;; *) echo "Invalid boolean: $flag"; exit 2 ;; esac
done
if [ "$REVIEW" = true ]; then
    PUSH=false
    NOTIFY=false
fi
echo "[$RUN_ID] start review=$REVIEW push=$PUSH notify=$NOTIFY"
cd "$REPO"
if [ -f analyst-refresh-paused ]; then
    echo 'Paused by analyst-refresh-paused sentinel; no source validation performed.'
    exit 1
fi
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo 'Checkout must be main'; exit 1; }
if [ "$REVIEW" = false ]; then
    git diff --cached --quiet || { echo 'Pre-existing staged changes; refusing automatic commit'; exit 1; }
    [ -z "$(git status --porcelain -- src/data/atlas)" ] || {
        echo 'Pre-existing Atlas changes; use review mode'; exit 1;
    }
fi

PHASE=sync
"$PYTHON" scripts/sync-atlas-content.py
PHASE=refresh
OUT="$("$PYTHON" scripts/refresh-analyst-read.py 2>&1)" || {
    rc=$?; echo "$OUT"; exit "$rc";
}
echo "$OUT"

PHASE=public-gates
"$PYTHON" scripts/sync-atlas-content.py --verify-only
PHASE=assert
"$PYTHON" "$ASSERT" check "$JOB"
PHASE=count
COUNT="$("$PYTHON" -c "import json; d=json.load(open('src/data/atlas/analyst_read.json')); assert len(d['narratives']) == 5; print(len(d['narratives']))")"

if [ "$REVIEW" = false ]; then
    PHASE=stage
    git add -- src/data/atlas/analyst_read.json src/data/atlas/ecosystem.md
    if ! git diff --cached --quiet; then
        PHASE=commit
        GIT_AUTHOR_NAME="Katie Lui" GIT_AUTHOR_EMAIL="64932844+katieluii@users.noreply.github.com" \
        GIT_COMMITTER_NAME="Katie Lui" GIT_COMMITTER_EMAIL="64932844+katieluii@users.noreply.github.com" \
            git commit -q -m 'Atlas analyst read: weekly refresh of 5 hottest themes'
    fi
    if [ "$PUSH" = true ]; then
        PHASE=push
        git push -q origin main
    fi
fi

PHASE=receipt
if [[ "$OUT" =~ ^refresh:\ ecosystem\.md\ unchanged\ since\ .*nothing\ to\ do\. ]]; then
    "$PYTHON" "$RECEIPT" write "$JOB" \
        --skipped 'ecosystem.md unchanged; source validation and output assertions passed' \
        --note "run=$RUN_ID review=$REVIEW push=$PUSH"
else
    "$PYTHON" "$RECEIPT" write "$JOB" --items-in 5 --delivered "$COUNT" \
        --note "run=$RUN_ID weekly analyst read; review=$REVIEW push=$PUSH"
fi
if [ "$NOTIFY" = true ]; then
    PHASE=notification
    "$HOME/.claude/telegram-meta-notify.sh" "Analyst read refreshed ($COUNT themes)" \
        "run=$RUN_ID review=$REVIEW push=$PUSH"
fi
PHASE=complete
