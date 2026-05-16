# ──────────────────────────────────────────────────────────────────────────────
#  Stage 1: Builder – install dependencies
# ──────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only manifests first to leverage Docker layer cache
COPY package*.json ./

# Install production + dev dependencies (dev needed for tests in CI)
RUN npm ci

# ──────────────────────────────────────────────────────────────────────────────
#  Stage 2: Production image – lean and secure
# ──────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY app.js ./
COPY package.json ./

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Health-check so orchestrators know when the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "app.js"]
