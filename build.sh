#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "🏗  Building for production..."

# Build React app
cd "$FRONTEND"
npm install
npm run build

echo ""
echo "✅ Built! To run in production:"
echo "   cd backend && venv/bin/uvicorn main:app --port 8000"
echo "   Then open http://localhost:8000"
