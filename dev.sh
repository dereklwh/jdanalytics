#!/usr/bin/env bash
set -e

trap 'kill 0' EXIT

# Start backend
echo "Starting backend on http://127.0.0.1:8000 ..."
(cd fantasy/server && source venv/bin/activate && uvicorn api.main:app --reload) &

# Start frontend
echo "Starting frontend on http://localhost:5173 ..."
(cd fantasy/client && npm run dev) &

wait
