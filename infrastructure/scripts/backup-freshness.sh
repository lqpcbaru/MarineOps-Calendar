#!/bin/sh
# MarineOps — backup freshness check
#
# Answers the one question `OnFailure` cannot: did a backup actually
# happen recently? marineops-alert@.service fires when a backup ran and
# failed, so it says nothing about a backup that never ran at all — a
# timer that was never enabled, one that got masked, or a host that was
# off. Silence from the alert hook is therefore not evidence of success,
# and this is the check that closes that gap.
#
#   BACKUP_DIR=/var/backups/marineops ./infrastructure/scripts/backup-freshness.sh
#
# Exit codes, deliberately the same severities health-check.sh uses so a
# monitor can treat both the same way:
#   0  fresh: a dump newer than MAX_AGE_HOURS exists
#   1  stale: dumps exist, but the newest is older than MAX_AGE_HOURS
#   2  none: no dump at all, or BACKUP_DIR does not exist
#   3  usage error
#
# Run it on the backup host, where BACKUP_DIR is visible — unlike
# health-check.sh, this cannot be done from outside. Over ssh from the
# monitoring host is fine and keeps the alerting off the box being
# checked.

set -eu

# Default matches the path marineops-backup.service creates.
BACKUP_DIR="${BACKUP_DIR:-/var/backups/marineops}"

# The timer runs daily, so ~2 days allows one missed run plus the
# timer's RandomizedDelaySec before anyone is told.
MAX_AGE_HOURS="${MAX_AGE_HOURS:-48}"

case "$MAX_AGE_HOURS" in
  '' | *[!0-9]*)
    echo "MAX_AGE_HOURS must be a whole number of hours (got \"$MAX_AGE_HOURS\")" >&2
    exit 3
    ;;
esac

if [ ! -d "$BACKUP_DIR" ]; then
  echo "NONE     backup dir      $BACKUP_DIR does not exist"
  echo ""
  echo "NO BACKUP — the directory the timer writes to is not there"
  exit 2
fi

# `find -mmin` does the age comparison, so there is no date parsing and
# nothing to go wrong between GNU and BusyBox — the same reason
# health-check.sh uses `openssl -checkend` rather than `date -d`.
newest_fresh=$(find "$BACKUP_DIR" -name 'marineops_*.dump' -type f \
  -mmin "-$((MAX_AGE_HOURS * 60))" 2>/dev/null | head -n 1 || true)
any=$(find "$BACKUP_DIR" -name 'marineops_*.dump' -type f 2>/dev/null | head -n 1 || true)

if [ -z "${any:-}" ]; then
  echo "NONE     dumps           none in $BACKUP_DIR"
  echo ""
  echo "NO BACKUP — the timer has never produced a dump here"
  exit 2
fi

count=$(find "$BACKUP_DIR" -name 'marineops_*.dump' -type f 2>/dev/null | wc -l | tr -d ' ')

if [ -n "${newest_fresh:-}" ]; then
  echo "OK       freshness       a dump is newer than ${MAX_AGE_HOURS}h ($count retained)"
  echo ""
  echo "fresh"
  exit 0
fi

echo "STALE    freshness       newest dump is older than ${MAX_AGE_HOURS}h ($count retained)"
echo ""
echo "STALE — backups are not running; check:"
echo "  systemctl list-timers marineops-backup.timer"
echo "  systemctl is-failed marineops-backup.service"
echo "  journalctl -u marineops-backup.service -n 50"
exit 1
