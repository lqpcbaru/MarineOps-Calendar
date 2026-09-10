#!/bin/sh
# MarineOps Calendar — PostgreSQL backup
#
# The runbook requires a backup before every migration, but until now that
# was a prose instruction with a bare `pg_dump` line — no retention, no
# integrity check, and nothing an operator could put on a schedule.
#
# This script is the repository half of that requirement. It does NOT
# schedule itself: the schedule, the storage location and the offsite copy
# are infrastructure decisions that depend on the hosting provider, and
# nothing here invents them. Point BACKUP_DIR at a mounted volume and drive
# this from cron/systemd/your provider's scheduler.
#
# Usage:
#   DATABASE_URL=postgresql://... ./infrastructure/scripts/db-backup.sh
#
# Environment:
#   DATABASE_URL     required — same value the API uses
#   BACKUP_DIR       default ./backups
#   RETENTION_DAYS   default 14 — dumps older than this are deleted
#
# Requires pg_dump on PATH (postgresql-client), matching the server's major
# version. To avoid installing it on the host, run it through the same
# Postgres image the stack uses:
#
#   docker run --rm --network marineops \
#     -e DATABASE_URL="$DATABASE_URL" \
#     -v "$PWD/backups:/backups" -e BACKUP_DIR=/backups \
#     -v "$PWD/infrastructure/scripts:/scripts" \
#     postgres:16-alpine /scripts/db-backup.sh

set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

command -v pg_dump >/dev/null 2>&1 || {
  echo "ERROR: pg_dump not found on PATH. Install postgresql-client, or run" >&2
  echo "       this script inside the postgres:16-alpine image (see header)." >&2
  exit 1
}

mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/marineops_${STAMP}.dump"

echo "=== MarineOps — PostgreSQL backup ==="
# Never echo DATABASE_URL: it contains the password.
echo "[1/3] Dumping to ${OUT} ..."

# Custom format (-Fc): compressed, and restorable selectively with pg_restore.
# Written to a .part file first so a crash cannot leave a truncated dump that
# looks like a valid backup — the exact failure that makes a restore fail
# when it is finally needed.
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges \
  --file="${OUT}.part"
mv "${OUT}.part" "$OUT"

echo "[2/3] Verifying the dump is readable ..."
# Proves the archive's table of contents parses. This is not a full restore
# test — see the runbook, which requires a periodic real restore drill.
pg_restore --list "$OUT" >/dev/null

SIZE="$(wc -c < "$OUT" | tr -d ' ')"
if [ "$SIZE" -lt 1024 ]; then
  echo "ERROR: dump is only ${SIZE} bytes — refusing to treat it as valid." >&2
  exit 1
fi

echo "[3/3] Pruning dumps older than ${RETENTION_DAYS} days ..."
find "$BACKUP_DIR" -name 'marineops_*.dump' -type f -mtime "+${RETENTION_DAYS}" -print -delete

echo ""
echo "=== Backup complete: ${OUT} (${SIZE} bytes) ==="
echo "Restore with:"
echo "  pg_restore --dbname=\"\$DATABASE_URL\" --clean --if-exists ${OUT}"
