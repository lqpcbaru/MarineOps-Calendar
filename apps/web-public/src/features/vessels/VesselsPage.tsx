import { useState } from 'react';

interface VesselSummary {
  id: string;
  name: string | null;
  mmsi: string | null;
  imo: string | null;
  flag: string | null;
  vesselType: string | null;
  source: string;
  dataStatus: string;
  lastPositionAt: string | null;
  retrievedAt: string;
}

interface VesselProfile {
  identity: VesselSummary & { callsign: string | null; length: number | null; tonnage: number | null };
  position: { latitude: number; longitude: number; speed: number | null; timestamp: string } | null;
  events: VesselEvent[];
  source: string;
  retrievedAt: string;
}

interface VesselEvent {
  id: string;
  type: string;
  startAt: string;
  endAt: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  freshness: string;
}

export function VesselsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VesselSummary[]>([]);
  const [selected, setSelected] = useState<VesselProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await fetch(`/api/public/vessels/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Ralat carian');
      const data = await res.json();
      setResults(data.vessels || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ralat');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/vessels/${id}`);
      if (!res.ok) throw new Error('Ralat profil');
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ralat');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'KNOWN': return 'text-tide-400';
      case 'STALE': return 'text-warning-400';
      case 'UNKNOWN': return 'text-text-muted';
      case 'NO_RECENT_DATA': return 'text-warning-400';
      case 'AIS_GAP': return 'text-danger-400';
      default: return 'text-text-muted';
    }
  };

  const eventLabel = (type: string) => {
    switch (type) {
      case 'FISHING': return 'Perikanan';
      case 'ENCOUNTER': return 'Pertemuan';
      case 'LOITERING': return 'Berkeliaran';
      case 'AIS_GAP': return 'Jurang AIS';
      case 'PORT_VISIT': return 'Lawatan Pelabuhan';
      default: return type;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-text-primary">Perisikan Kapal</h1>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari kapal (nama, MMSI, IMO)..."
          className="flex-1 rounded-lg border border-marine-600 bg-surface-raised px-4 py-2.5 text-text-primary placeholder-text-muted focus:border-ocean-400 focus:outline-none"
          aria-label="Carian kapal"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary min-h-[2.75rem]">
          Cari
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-6 space-y-2" role="status" aria-label="Memuatkan">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-marine-700" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-danger-400/30 bg-danger-400/5 p-4 text-center" role="alert">
          <p className="text-sm text-danger-400">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && results.length === 0 && query && (
        <div className="mb-6 rounded-lg border border-dashed border-marine-600 p-8 text-center">
          <p className="text-text-muted">Tiada kapal ditemui untuk "{query}"</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6 space-y-2">
          {results.map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelect(v.id)}
              className="card-flat flex w-full items-center justify-between text-left transition-colors hover:border-marine-500"
            >
              <div>
                <p className="font-semibold text-text-primary">{v.name || 'Tidak Dikenali'}</p>
                <p className="text-sm text-text-secondary">
                  {v.mmsi && `MMSI: ${v.mmsi}`} {v.flag && `• ${v.flag}`} {v.vesselType && `• ${v.vesselType}`}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold ${statusColor(v.dataStatus)}`}>{v.dataStatus}</span>
                <p className="text-xs text-text-muted">{v.source}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Profile */}
      {selected && (
        <div className="space-y-4">
          <div className="card-flat">
            <h2 className="mb-4 text-xl font-bold text-text-primary">{selected.identity.name || 'Tidak Dikenali'}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {selected.identity.mmsi && <div><span className="text-text-muted">MMSI</span><p className="text-text-primary">{selected.identity.mmsi}</p></div>}
              {selected.identity.imo && <div><span className="text-text-muted">IMO</span><p className="text-text-primary">{selected.identity.imo}</p></div>}
              {selected.identity.flag && <div><span className="text-text-muted">Bendera</span><p className="text-text-primary">{selected.identity.flag}</p></div>}
              {selected.identity.vesselType && <div><span className="text-text-muted">Jenis</span><p className="text-text-primary">{selected.identity.vesselType}</p></div>}
              {selected.identity.callsign && <div><span className="text-text-muted">Tanda Panggilan</span><p className="text-text-primary">{selected.identity.callsign}</p></div>}
              {selected.identity.length && <div><span className="text-text-muted">Panjang</span><p className="text-text-primary">{selected.identity.length}m</p></div>}
              {selected.identity.tonnage && <div><span className="text-text-muted">Tanan</span><p className="text-text-primary">{selected.identity.tonnage}</p></div>}
              <div><span className="text-text-muted">Sumber</span><p className="text-text-primary">{selected.source}</p></div>
            </div>
            {selected.position && (
              <div className="mt-3 text-xs text-text-muted">
                Kedudukan terakhir: {selected.position.latitude.toFixed(4)}, {selected.position.longitude.toFixed(4)} ({selected.position.timestamp})
              </div>
            )}
          </div>

          {/* Events */}
          {selected.events.length > 0 && (
            <div className="card-flat">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Aktiviti</h3>
              <div className="space-y-2">
                {selected.events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between border-b border-marine-700 py-2 text-sm last:border-0">
                    <div>
                      <span className="font-semibold text-text-primary">{eventLabel(ev.type)}</span>
                      <span className="ml-2 text-text-muted">{ev.startAt}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-text-muted">{ev.freshness} • {ev.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
