# Backup scheduling units

`infrastructure/scripts/db-backup.sh` takes a verified, self-pruning
dump, but it cannot schedule itself. These units are that missing half.

**Until they are installed and enabled, there are no backups** — the
runbook says so, and this directory does not change that on its own.

## Install

```bash
sudo mkdir -p /etc/marineops
sudo install -m 0600 /dev/null /etc/marineops/backup.env
sudo editor /etc/marineops/backup.env      # DATABASE_URL=postgresql://...

sudo cp infrastructure/systemd/marineops-backup.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now marineops-backup.timer
```

Adjust `MARINEOPS_DIR` and `BACKUP_DIR` in the `.service` file if the
checkout or backup directory live elsewhere.

## Why the credential is in a separate file

`DATABASE_URL` is loaded by systemd from `/etc/marineops/backup.env`
(mode `0600`, root-only) and passed to the container by name, never by
value. It therefore appears in neither the unit file, nor `systemctl
show`, nor the container's command line — all three of which are
readable by any local user.

## Verify

```bash
systemctl list-timers marineops-backup.timer   # next scheduled run
sudo systemctl start marineops-backup.service  # run once, now
journalctl -u marineops-backup.service -n 40   # what happened
ls -la /var/backups/marineops                  # the dumps themselves
```

A successful run ends with `Backup complete: …` and a byte count. The
script refuses to treat a dump under 1 KB as valid, and verifies the
archive's table of contents parses before renaming it into place.

## Restore

Scheduling backups is not the same as having a restore you trust. The
runbook's restore procedure must be rehearsed against a scratch database
periodically — a dump nobody has ever restored is a hypothesis, not a
backup.

## Failure notification

A failed backup was previously recorded by systemd and read by nobody.
`marineops-backup.service` now declares
`OnFailure=marineops-alert@%n.service`, which runs
`/etc/marineops/alert.sh` with the failed unit's name.

```bash
sudo cp infrastructure/systemd/marineops-alert@.service /etc/systemd/system/
sudo install -m 0700 infrastructure/scripts/alert-hook.sh /etc/marineops/alert.sh
sudo editor /etc/marineops/alert.sh          # add your delivery command
sudo install -m 0600 /dev/null /etc/marineops/alert.env   # and its credentials
sudo systemctl daemon-reload

# fire it without waiting for a real failure
sudo systemctl start marineops-alert@test.service
journalctl -u 'marineops-alert@*' -n 20
```

**As shipped the hook only writes to the journal**, and logs a warning
saying so. That is more than before — a failure now produces a
`daemon.err` entry and a named unit failure — but it is not delivery.
Point it at whatever you already use; the repository cannot choose that,
and a hook that looked configured while doing nothing would be worse
than one that admits it.

Delivery credentials belong in `/etc/marineops/alert.env` (mode 0600),
loaded by the unit, so they stay out of the script.

## Not covered here

- **Offsite copies.** These dumps sit on the same host as the
  application. A host loss takes both. Ship `/var/backups/marineops`
  somewhere else; which object store or backup service is an
  infrastructure decision this repository does not make. The transport,
  the permissions each leg must keep, the retention rule and the
  restore-from-offsite procedure are in the runbook's "Offsite copies"
  section.
- **A delivery destination.** `OnFailure=` _is_ wired — it runs
  `marineops-alert@.service`, verified under systemd — but as shipped
  that hook only writes to the journal and logs a warning saying so. Put
  your paging command in `/etc/marineops/alert.sh` and its credentials in
  `/etc/marineops/alert.env` (mode 0600, loaded by the unit). Until then
  nothing reaches a human.
- **Noticing a backup that never ran.** `OnFailure=` needs a failure to
  fire, so it cannot see a timer that was never enabled or got masked.
  `infrastructure/scripts/backup-freshness.sh` covers that — run it from
  cron here, or over ssh from the monitoring host.
