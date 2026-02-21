#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "🥘 Starting Meal Planner..."

# ── Backend setup ────────────────────────────────────────────────────────────
if [ ! -d "$BACKEND/venv" ]; then
  echo "📦 Creating Python virtualenv..."
  python3 -m venv "$BACKEND/venv"
fi

echo "📦 Installing Python dependencies..."
"$BACKEND/venv/Scripts/pip" install -q -r "$BACKEND/requirements.txt"

# ── Frontend setup ───────────────────────────────────────────────────────────
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  cd "$FRONTEND" && npm install
fi

# ── Start both processes ─────────────────────────────────────────────────────
echo ""
echo "✅ Backend:  http://localhost:8000"
echo "✅ Frontend: http://localhost:5173  (open this one in your browser)"
echo ""

# Start backend
cd "$BACKEND"
"$BACKEND/venv/Scripts/uvicorn" main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
