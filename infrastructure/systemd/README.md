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

## Not covered here

- **Offsite copies.** These dumps sit on the same host as the
  application. A host loss takes both. Ship `/var/backups/marineops`
  somewhere else; which object store or backup service is an
  infrastructure decision this repository does not make.
- **Alerting on failure.** systemd will record the failure, but nothing
  reads that. Add an `OnFailure=` hook to whatever paging you use, or
  scrape the unit's state.
