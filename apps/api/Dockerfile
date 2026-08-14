FROM node:22-alpine AS builder
WORKDIR /app

# Copy lockfiles and workspace manifests first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
# Copy package manifests for workspace packages (so pnpm can resolve local deps)
COPY apps/api/package.json apps/api/package.json
COPY packages/ packages/

# Install full workspace (including dev deps) to allow prisma generate & build
RUN corepack enable && pnpm install --frozen-lockfile

# Copy the full API source (after install to leverage cache)
COPY apps/api/ apps/api/

# Generate Prisma client and build the API
RUN pnpm --filter @marineops/api exec prisma generate
RUN pnpm --filter @marineops/api build

# Create a production-only node_modules that contains only the API runtime deps.
# This removes dev deps and recreates node_modules filtered to the API package.
RUN rm -rf node_modules && pnpm install --frozen-lockfile --prod --filter @marineops/api...


FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable

# Copy the production node_modules and built output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1
CMD ["node", "dist/main.js"]
