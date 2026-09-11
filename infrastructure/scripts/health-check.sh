#!/bin/sh
# MarineOps — external health check
#
# Probes a running deployment from outside and exits with a code that
# says how bad it is. No credentials, no account, no agent: it is meant
# to be the thing an operator wires into whatever alerting they already
# have, because the repository cannot choose that for them.
#
#   BASE_URL=https://marineops.example ./infrastructure/scripts/health-check.sh
#
# Exit codes — chosen so the severity is usable directly by a monitor:
#   0  healthy
#   1  degraded: serving, but something needs attention soon
#   2  down: not serving
#   3  usage error
#
# Why check from outside rather than rely on the container healthchecks:
# those only report whether a process answers on loopback. They cannot
# see an expired certificate, a broken TLS terminator, DNS pointing
# somewhere else, or a firewall change — all of which leave the
# containers "healthy" and the site unreachable.
#
# Wiring examples are in docs/operations/PRODUCTION_RUNBOOK.md.

set -eu

if [ -z "${BASE_URL:-}" ]; then
  echo "BASE_URL is required, e.g. BASE_URL=https://marineops.example $0" >&2
  # 3, not 1: a monitor needs to tell "this check is misconfigured" from
  # "the site is down", and they call for different people.
  exit 3
fi

# Warn this many days before the certificate expires. Let's Encrypt
# certificates last 90 days and Caddy renews at 30 remaining, so 21 means
# "renewal should already have happened and did not".
CERT_WARN_DAYS="${CERT_WARN_DAYS:-21}"
TIMEOUT="${TIMEOUT:-10}"

status=0
note() { printf '%s\n' "$*"; }
# Never downgrade a worse verdict.
worse() { [ "$1" -gt "$status" ] && status="$1"; return 0; }

# curl already prints 000 when it cannot connect, so a `|| echo 000`
# fallback concatenates onto it and yields "000000".
http_code() {
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$1" 2>/dev/null) || true
  [ -n "${code:-}" ] || code=000
  printf '%s' "$code"
}

# ── liveness: is the process answering at all ────────────────────
live=$(http_code "$BASE_URL/health/live")
if [ "$live" = "200" ]; then
  note "OK       live            200"
else
  note "DOWN     live            $live"
  worse 2
fi

# ── readiness: can it serve, i.e. is the database reachable ──────
#
# Deliberately separate from liveness. A 200 here with a 503 there is
# the signature of a database outage rather than an application fault,
# and the two page different people.
ready=$(http_code "$BASE_URL/health/ready")
if [ "$ready" = "200" ]; then
  note "OK       ready           200"
elif [ "$ready" = "503" ]; then
  note "DOWN     ready           503  (database unreachable)"
  worse 2
else
  note "DOWN     ready           $ready"
  worse 2
fi

# ── the portals themselves ──────────────────────────────────────
for path in / /admin/; do
  code=$(http_code "$BASE_URL$path")
  if [ "$code" = "200" ]; then
    note "OK       portal $(printf '%-8s' "$path") 200"
  else
    note "DOWN     portal $(printf '%-8s' "$path") $code"
    worse 2
  fi
done

# ── a public endpoint that needs no provider credential ─────────
#
# /stations reads only our own database, so a failure here is ours. The
# sourced-data endpoints are checked separately below precisely because
# their failure usually is not.
stations=$(http_code "$BASE_URL/api/public/stations")
if [ "$stations" = "200" ]; then
  note "OK       api stations    200"
else
  note "DOWN     api stations    $stations"
  worse 2
fi

# ── HSTS, which is also a cheap proof TLS is terminating ─────────
if curl -sSI --max-time "$TIMEOUT" "$BASE_URL/" 2>/dev/null | grep -qi '^strict-transport-security'; then
  note "OK       hsts            present"
else
  note "WARN     hsts            absent  (is TLS terminating?)"
  worse 1
fi

# ── certificate expiry ──────────────────────────────────────────
#
# Caddy renews automatically and silently; when renewal stops working
# nothing complains until the certificate actually expires and the site
# breaks for everyone at once. This is the only warning you get.
case "$BASE_URL" in
  https://*)
    host=$(printf '%s' "$BASE_URL" | sed -e 's#^https://##' -e 's#[:/].*$##')
    if command -v openssl >/dev/null 2>&1; then
      end=$(printf 'Q\n' \
        | openssl s_client -connect "$host:443" -servername "$host" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null \
        | sed 's/^notAfter=//')
      if [ -n "${end:-}" ]; then
        end_epoch=$(date -d "$end" +%s 2>/dev/null || echo '')
        if [ -n "$end_epoch" ]; then
          days=$(( (end_epoch - $(date +%s)) / 86400 ))
          if [ "$days" -lt 0 ]; then
            note "DOWN     certificate     EXPIRED ${days#-} days ago"
            worse 2
          elif [ "$days" -lt "$CERT_WARN_DAYS" ]; then
            note "WARN     certificate     expires in $days days (renewal should have run)"
            worse 1
          else
            note "OK       certificate     expires in $days days"
          fi
        else
          note "WARN     certificate     could not parse expiry date"
          worse 1
        fi
      else
        note "WARN     certificate     could not read from $host:443"
        worse 1
      fi
    else
      note "SKIP     certificate     openssl not installed"
    fi
    ;;
  *)
    note "SKIP     certificate     BASE_URL is not https"
    ;;
esac

# ── sourced data: reported, never alerted on ────────────────────
#
# 503 PROVIDER_CONFIG_ERROR is the normal state until provider
# credentials and per-station codes are supplied, so it must not affect
# the exit code. Paging on it before setup is finished only teaches
# people to ignore the channel. It is printed so an operator checking by
# hand can see progress.
today=$(date -u +%Y-%m-%d)
for endpoint in tide weather wind-wave; do
  code=$(http_code "$BASE_URL/api/public/$endpoint?dateFrom=$today&dateTo=$today")
  case "$code" in
    200) note "OK       provider $(printf '%-9s' "$endpoint") 200" ;;
    503) note "INFO     provider $(printf '%-9s' "$endpoint") 503  (not configured — expected until codes are supplied)" ;;
    *)   note "INFO     provider $(printf '%-9s' "$endpoint") $code" ;;
  esac
done

note ""
case "$status" in
  0) note "healthy" ;;
  1) note "DEGRADED — serving, but something needs attention" ;;
  2) note "DOWN — not serving" ;;
esac

exit "$status"
