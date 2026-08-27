FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace manifests and full source before install so pnpm can
# resolve workspace links and the Prisma CLI correctly.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

# Install full workspace (including dev deps) to allow prisma generate & build
RUN corepack enable && pnpm install --frozen-lockfile

# Generate Prisma client and build the API
RUN pnpm --filter @marineops/api exec prisma generate
RUN pnpm --filter @marineops/api build

# Produce a self-contained production deployment directory with only the
# API's runtime dependencies (flat node_modules with @nestjs/core,
# @prisma/client, argon2, etc.).
RUN pnpm --filter @marineops/api deploy --prod /prod/api

# Regenerate the Prisma client inside the deployed node_modules. The deploy
# copies a fresh @prisma/client from the store whose postinstall does NOT
# emit the .prisma/client engine code, so we re-run prisma generate against
# the deployed schema using the builder's prisma CLI.
RUN cd /prod/api && \
  /app/apps/api/node_modules/.bin/prisma generate --schema ./prisma/schema.prisma


FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable

# Copy the self-contained production deployment output, owned by the
# non-root `node` user built into the official node:alpine image.
COPY --from=builder --chown=node:node /prod/api ./

ENV NODE_ENV=production
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1
CMD ["node", "dist/main.js"]
