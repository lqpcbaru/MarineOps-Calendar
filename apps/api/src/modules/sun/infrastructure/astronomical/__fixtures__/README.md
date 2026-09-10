# Ephemeris reference fixture

`ephemeris-reference.json` holds sunrise, sunset, solar noon, moonrise,
moonset, lunar illumination and Earth–Moon distance for six stations on
twelve dates. It is the reference that `ephemeris-accuracy.spec.ts`
measures both astronomical engines against.

**These values were not written by hand and were not produced by this
codebase.** They come from [PyEphem](https://rhodesmill.org/pyephem/),
which wraps XEphem's VSOP87 (solar) and ELP2000 (lunar) implementations —
an independent, long-established library. Checking our own arithmetic
against our own arithmetic would prove nothing; the point is an outside
opinion.

## Why these stations and dates

Six stations span the country's full extent — Langkawi (99.8°E) to Tawau
(117.9°E), Kuching at 1.55°N to Kudat at 6.88°N — because the defects
this fixture guards against were all coordinate-dependent, and a single
station would have hidden every one of them.

The dates target where date arithmetic breaks rather than where it is
comfortable: both solstices, a year boundary, 29 February 2028 with the
days either side of it, and a new and a full moon.

## Regenerating

Every station is UTC+8 year-round (`Asia/Kuala_Lumpur` and
`Asia/Kuching`), and rise/set searches are anchored at the start of the
**local** day, not midnight UTC. That distinction is not cosmetic: at
these longitudes sunrise falls on the previous UTC date, so anchoring at
midnight UTC returns the _following_ local day's sunrise and every
comparison comes out a clean 24 hours wrong.

```bash
pip install ephem
python - <<'PY'
import ephem, json, datetime

MYT_OFFSET_HOURS = 8
STATIONS = [("LGK-01", 6.35, 99.8), ("PKG-01", 3.0033, 101.3925),
            ("MSG-01", 2.4333, 103.8333), ("KCH-01", 1.5535, 110.3593),
            ("KDT-01", 6.8833, 116.8333), ("TWU-01", 4.2636, 117.8939)]
DAYS = ["2026-08-28", "2026-09-01", "2026-09-11", "2026-12-22", "2027-03-16",
        "2027-06-22", "2027-12-28", "2027-12-31", "2028-01-01", "2028-02-28",
        "2028-02-29", "2028-03-01"]

def local_day_start(day):
    return ephem.Date(datetime.datetime.strptime(day, "%Y-%m-%d")
                      - datetime.timedelta(hours=MYT_OFFSET_HOURS))

def observer(lat, lon):
    o = ephem.Observer()
    o.lat, o.lon, o.elevation = str(lat), str(lon), 0
    o.pressure = 0            # no atmospheric model; horizon set explicitly
    o.horizon = "-0:34"       # standard refraction at the horizon
    return o

def iso(t):
    return ephem.Date(t).datetime().replace(microsecond=0).isoformat() + "Z"

out = {}
for code, lat, lon in STATIONS:
    out[code] = {"latitude": lat, "longitude": lon, "days": {}}
    for day in DAYS:
        o, start = observer(lat, lon), local_day_start(day)
        end = float(start) + 1.0
        rec = {}
        for name, body, fn in (("sunrise", ephem.Sun(), "next_rising"),
                               ("sunset", ephem.Sun(), "next_setting"),
                               ("solarNoon", ephem.Sun(), "next_transit")):
            o.date = start
            rec[name] = iso(getattr(o, fn)(body, start=start))
        for name, fn in (("moonrise", "next_rising"), ("moonset", "next_setting")):
            o.date = start
            t = getattr(o, fn)(ephem.Moon(), start=start)
            rec[name] = iso(t) if float(t) < end else None
        noon = ephem.Date(float(start) + 0.5)
        m = ephem.Moon(); m.compute(noon)
        rec["illumination"] = round(m.moon_phase * 100)
        rec["distanceKm"] = round(m.earth_distance * ephem.meters_per_au / 1000)
        out[code]["days"][day] = rec

print(json.dumps(out, indent=2))
PY
```

## Tolerances

`ephemeris-accuracy.spec.ts` allows 4 minutes, 3 percentage points of
illumination and 2000 km. Measured across 20 stations × 53 weekly dates
spanning a year, the engines' worst deviations were 1.6 min (sun), 1.3
min (moon rise/set), 1 percentage point and 400 km — so the bounds sit
comfortably clear of normal variation while still catching the faults
that have actually occurred here, each of which moved results by tens of
minutes or more.
