# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 1 — Dependency builder
#   Compiles C extensions (asyncpg, bcrypt) once in an isolated
#   layer so the final image needs no build toolchain at runtime.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM python:3.11-slim AS builder

WORKDIR /build

# System build deps — only in this stage
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip + install wheel for binary wheels
RUN pip install --upgrade pip wheel

# Copy and compile Python dependencies into a local directory
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 2 — Lean production runtime
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM python:3.11-slim AS runtime

# Runtime system deps only (libpq for asyncpg DSO)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled Python packages from builder
COPY --from=builder /install /usr/local

# Create a non-root application user (security best practice)
RUN groupadd --system appgroup && \
    useradd  --system --gid appgroup --shell /bin/false appuser

WORKDIR /app

# Copy application source
COPY --chown=appuser:appgroup . .

# Copy entrypoint and make executable
COPY --chown=appuser:appgroup entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 8000

# Health check — hits the OpenAPI docs endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/docs || exit 1

ENTRYPOINT ["/entrypoint.sh"]
