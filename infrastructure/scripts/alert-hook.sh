#!/bin/sh
# MarineOps — failure notification hook.
#
# Invoked by marineops-alert@.service with the failed unit's name as $1.
# Installed to /etc/marineops/alert.sh, mode 0700.
#
# AS SHIPPED THIS ONLY WRITES TO THE JOURNAL. That is deliberate: the
# repository does not know where you want to be told, and a hook that
# silently did nothing while looking configured would be worse than one
# that says so.
#
# Add a delivery command below. Anything that exits non-zero on failure
# will be recorded by systemd, so a broken webhook is itself visible.

set -eu

unit="${1:-unknown}"
host=$(hostname)
when=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

message="MarineOps: unit ${unit} failed on ${host} at ${when}"

# Always leave a trace in the journal, whatever else happens.
logger -t marineops-alert -p daemon.err "$message"

# ── Add your delivery here ──────────────────────────────────────
#
# Credentials come from /etc/marineops/alert.env (mode 0600), loaded by
# the unit, so they are never written into this file.
#
# Webhook, for example:
#   [ -n "${ALERT_WEBHOOK_URL:-}" ] && curl -fsS --max-time 15 \
#     -H 'Content-Type: application/json' \
#     -d "$(printf '{"text":"%s"}' "$message")" \
#     "$ALERT_WEBHOOK_URL" >/dev/null
#
# Mail, for example:
#   [ -n "${ALERT_EMAIL:-}" ] && printf '%s\n' "$message" \
#     | mail -s "MarineOps failure: ${unit}" "$ALERT_EMAIL"

if [ -z "${ALERT_WEBHOOK_URL:-}${ALERT_EMAIL:-}" ]; then
  logger -t marineops-alert -p daemon.warning \
    "no delivery configured in /etc/marineops/alert.sh — failure recorded in the journal only"
fi
