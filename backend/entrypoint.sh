#!/bin/bash
set -euo pipefail

# Force Docker into the correct directory so Alembic finds its config
cd /app

GREEN='\033[0;32m'
NC='\033[0m'
log_info()  { echo -e "${GREEN}[AgentRegistry]${NC} $*"; }

log_info "PostgreSQL health handled by Docker. Proceeding..."

# ── 1. Run Alembic migrations ─────────────────────────────────
log_info "Running Alembic database migrations..."
alembic upgrade head
log_info "Migrations complete ✓"

# ── 2. Launch Uvicorn ─────────────────────────────────────────
WORKERS="${UVICORN_WORKERS:-2}"
log_info "Starting Uvicorn with ${WORKERS} worker(s)..."

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${WORKERS}" \
    --log-level "${LOG_LEVEL:-info}" \
    --proxy-headers \
    --forwarded-allow-ips "*"