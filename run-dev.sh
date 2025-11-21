#!/usr/bin/env bash
set -euo pipefail

# run-dev.sh
# Starts backend and frontend dev servers in the background, ensures Node v20.19.5 via nvm.
# Logs are written to ./dev-backend.log and ./dev-frontend.log. PIDs are saved to ./dev-backend.pid and ./dev-frontend.pid

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
NVM_DIR="$HOME/.nvm"
NODE_VER="20.19.5"

echo "Starting dev environment from: $ROOT_DIR"

# Ensure nvm is available
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
elif command -v nvm >/dev/null 2>&1; then
  echo "nvm is available in PATH"
else
  echo "nvm not found. Installing nvm (will modify your shell profile)..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

echo "Installing/using Node $NODE_VER via nvm..."
nvm install "$NODE_VER"
nvm use "$NODE_VER"

echo "Node version: $(node -v)"
echo "npm  version: $(npm -v)"

# Start backend
echo "Starting backend (PORT=5001)..."
pushd "$ROOT_DIR/backend" >/dev/null
export PORT=5001
# start in background, write logs and pid
npm run dev > "$ROOT_DIR/dev-backend.log" 2>&1 &
echo $! > "$ROOT_DIR/dev-backend.pid"
popd >/dev/null

# Start frontend
echo "Starting frontend..."
pushd "$ROOT_DIR/frontend" >/dev/null
npm run dev > "$ROOT_DIR/dev-frontend.log" 2>&1 &
echo $! > "$ROOT_DIR/dev-frontend.pid"
popd >/dev/null

echo "Servers started. Backend: http://localhost:5001  Frontend (Vite): usually http://localhost:5173 or printed in frontend logs."
echo "Tail logs with: tail -f dev-backend.log dev-frontend.log"

cat <<'USAGE'
Useful commands:
  ./run-dev.sh           # start backend + frontend (ensure script is executable)
  ./stop-dev.sh          # stop servers started by run-dev.sh
  tail -f dev-backend.log dev-frontend.log
USAGE

exit 0
