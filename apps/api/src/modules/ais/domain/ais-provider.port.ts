import type { AisVesselSummary, AisVesselProfile, AisVesselEvent } from './ais-dto';

export interface AISProviderPort {
  searchVessels(query: string, page?: number, pageSize?: number): Promise<{ vessels: AisVesselSummary[]; total: number }>;
  getVesselProfile(vesselId: string): Promise<AisVesselProfile>;
  getVesselEvents(vesselId: string, dateFrom?: string, dateTo?: string): Promise<AisVesselEvent[]>;
}
