#!/usr/bin/env bash
set -euo pipefail

# stop-dev.sh
# Stops processes started by run-dev.sh by reading pid files and removing them.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

stop_if_pidfile() {
  local pf="$1"
  if [ -f "$pf" ]; then
    pid=$(cat "$pf" 2>/dev/null || echo '')
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Stopping PID $pid"
      kill "$pid" || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        echo "PID $pid still alive; sending SIGKILL"
        kill -9 "$pid" || true
      fi
    else
      echo "No running process for PID file $pf"
    fi
    rm -f "$pf"
  else
    echo "PID file $pf not found"
  fi
}

stop_if_pidfile "$ROOT_DIR/dev-backend.pid"
stop_if_pidfile "$ROOT_DIR/dev-frontend.pid"

echo "Stopped. You can review logs: $ROOT_DIR/dev-backend.log $ROOT_DIR/dev-frontend.log"

exit 0
