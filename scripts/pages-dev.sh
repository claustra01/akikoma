#!/bin/sh
set -eu

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8788}"
PERSIST_DIR="${PERSIST_DIR:-.wrangler/state}"
PID_FILE="${PID_FILE:-.wrangler/pages-dev.pid}"
WRANGLER_HOME="${WRANGLER_HOME:-.wrangler-home}"
TOKEN_PEPPER="${TOKEN_PEPPER:-local-dev-token-pepper}"
STDIN_FIFO="${STDIN_FIFO:-.wrangler/pages-dev.stdin}"

SERVER_PID=""
STDIN_PID=""

cleanup() {
  if [ -n "$STDIN_PID" ]; then
    kill "$STDIN_PID" 2>/dev/null || true
  fi
  rm -f "$STDIN_FIFO"
}

stop_server() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  cleanup
  exit 0
}

trap stop_server INT TERM
trap cleanup EXIT

rm -f "$STDIN_FIFO"
mkfifo "$STDIN_FIFO"

tail -f /dev/null > "$STDIN_FIFO" &
STDIN_PID="$!"

WRANGLER_HOME="$WRANGLER_HOME" pnpm exec wrangler pages dev dist \
  --ip "$HOST" \
  --port "$PORT" \
  --persist-to "$PERSIST_DIR" \
  --binding "TOKEN_PEPPER=$TOKEN_PEPPER" \
  --show-interactive-dev-session=false \
  < "$STDIN_FIFO" &
SERVER_PID="$!"

echo "$SERVER_PID" > "$PID_FILE"
set +e
wait "$SERVER_PID"
STATUS="$?"
set -e

if [ "$STATUS" -eq 130 ] || [ "$STATUS" -eq 143 ]; then
  exit 0
fi

exit "$STATUS"
