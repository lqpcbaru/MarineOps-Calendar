import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStations } from '@/features/stesen/stesen.api';

export interface StationOption {
  id: string;
  code: string;
  name: string;
  timezone: string;
}

export interface StationPickerResult {
  stations: StationOption[];
  selectedStationId: string | undefined;
  selectedTimezone: string | undefined;
  setStationId: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

/**
 * Shared station-selection state used by every station-dependent page.
 *
 * Fetches the public station list once, defaults the selection to the first
 * station, and exposes the pieces each page needs to render a <StationSelect>
 * and call its data API with a real `stationId`.
 */
export function useStationPicker(queryKeySuffix: string): StationPickerResult {
  const [stationId, setStationId] = useState<string | undefined>(undefined);

  const stationsQuery = useQuery({
    queryKey: ['public-stations', queryKeySuffix],
    queryFn: () => getStations(1, 100),
  });

  const stations = useMemo<StationOption[]>(
    () =>
      (stationsQuery.data?.stations ?? []).map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        timezone: s.timezone,
      })),
    [stationsQuery.data],
  );

  const selectedStationId = stationId ?? stations[0]?.id;
  const selectedTimezone = stations.find((s) => s.id === selectedStationId)?.timezone;

  return {
    stations,
    selectedStationId,
    selectedTimezone,
    setStationId,
    isLoading: stationsQuery.isLoading,
    isError: stationsQuery.isError,
    error: stationsQuery.error,
  };
}
