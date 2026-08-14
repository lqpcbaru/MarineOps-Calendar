FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @marineops/api exec prisma generate
RUN pnpm --filter @marineops/api build

FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1
CMD ["node", "dist/main.js"]
