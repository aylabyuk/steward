#!/usr/bin/env bash
# Force-kill the local Firebase emulator suite when ports get stuck.
# Wired into `pnpm emulators` via the `preemulators` npm-hook so a
# fresh start always begins with a clean slate. Safe to run anytime —
# exits 0 immediately when no emulator processes match.
#
# Usage: ./kill-emulators.sh

set -uo pipefail

# Match by command line, not by port. Port matching swept up macOS
# launchd services that happened to share the broad emulator port
# range and broke unrelated things.
PATTERNS=(
  "firebase.*emulators:start"
  "cloud-firestore-emulator"
  "pubsub-emulator-"
  "firebase-tools/lib/bin/firebase.js"
)

emulator_pids() {
  for pat in "${PATTERNS[@]}"; do
    pgrep -f "$pat" 2>/dev/null
  done | sort -u
}

INITIAL=$(emulator_pids)
if [[ -z "$INITIAL" ]]; then
  exit 0
fi

echo "Stopping Firebase emulators (PIDs: $(echo "$INITIAL" | tr '\n' ' '))..."
echo "$INITIAL" | xargs -r kill 2>/dev/null

# Give Firebase CLI a moment to flush its export-on-exit + clean up children.
for _ in {1..5}; do
  sleep 1
  REMAINING=$(emulator_pids)
  [[ -z "$REMAINING" ]] && break
done

REMAINING=$(emulator_pids)
if [[ -z "$REMAINING" ]]; then
  echo "Emulators stopped."
  exit 0
fi

echo "Still alive after 5s: $(echo "$REMAINING" | tr '\n' ' '). Escalating to SIGKILL..."
echo "$REMAINING" | xargs -r kill -9 2>/dev/null
sleep 1

FINAL=$(emulator_pids)
if [[ -z "$FINAL" ]]; then
  echo "Emulators force-killed."
  exit 0
fi

echo "Still alive: $(echo "$FINAL" | tr '\n' ' '). Inspect: ps -p $FINAL -o pid,command"
exit 1
