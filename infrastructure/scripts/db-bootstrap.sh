#!/bin/sh
set -e

echo "=== MarineOps Calendar — DB bootstrap ==="
echo ""

echo "[1/3] Starting PostgreSQL..."
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres

echo "[2/3] Waiting for PostgreSQL to be ready..."
until docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres pg_isready -U marineops -d marineops_dev; do
  sleep 2
done
echo "PostgreSQL is ready."

echo "[3/3] Running Prisma migrations..."
pnpm --filter @marineops/api db:migrate:dev

echo ""
echo "=== Database bootstrap complete ==="
echo "DATABASE_URL=postgresql://marineops:changeme@localhost:5432/marineops_dev"
