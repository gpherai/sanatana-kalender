# =============================================================================
# DHARMA CALENDAR - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Based on: https://github.com/vercel/next.js/blob/canary/examples/with-docker
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:24.14.1-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat python3 make g++ py3-setuptools

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (devDependencies needed for build stage)
# python3 + make + g++ are required by swisseph (native node-gyp addon)
# The runner stage only uses standalone output, so this doesn't affect final image size
RUN npm ci && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:24.14.1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
# Prisma 7 resolves DATABASE_URL even during 'generate' (no DB connection needed).
# A placeholder value is enough — the real URL is injected at runtime via docker-compose.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

# Build Next.js application
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:24.14.1-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install netcat for database health check in entrypoint
RUN apk add --no-cache netcat-openbsd

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Standalone build output (includes only necessary node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client and schema (needed for runtime migrations)
# Note: no custom output path in schema.prisma, client lives in node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

# swisseph native addon (.node binary) — not included in standalone output
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/swisseph ./node_modules/swisseph

# Copy entrypoint script
COPY --chmod=755 scripts/docker-entrypoint.sh /docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname for Next.js
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Entrypoint runs migrations, then starts app
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command
CMD ["node", "server.js"]
