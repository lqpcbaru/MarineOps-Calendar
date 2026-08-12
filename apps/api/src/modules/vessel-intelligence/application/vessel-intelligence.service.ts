import { Injectable } from '@nestjs/common';
import type { VesselSearchResult, VesselEventsResult, VesselProfile } from '../domain';
import { mapToVesselSummary, mapToVesselEvent, mapToVesselProfile } from '../domain';
import { AisService } from '../../ais/application/ais.service';

@Injectable()
export class VesselIntelligenceService {
  constructor(private readonly aisService: AisService) {}

  async searchVessels(query: string, page = 1, pageSize = 20): Promise<VesselSearchResult> {
    const result = await this.aisService.searchVessels(query, page, pageSize);
    const freshness = result.freshness.status;

    return {
      vessels: result.vessels.map((v) => mapToVesselSummary(v, freshness)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      retrievedAt: new Date().toISOString(),
      source: result.freshness.source,
    };
  }

  async getVesselProfile(vesselId: string): Promise<VesselProfile> {
    const [profileResult, eventsResult] = await Promise.all([
      this.aisService.getVesselProfile(vesselId),
      this.aisService.getVesselEvents(vesselId),
    ]);

    return mapToVesselProfile(
      profileResult.profile,
      eventsResult.events,
      profileResult.freshness.status,
    );
  }

  async getVesselEvents(vesselId: string, dateFrom?: string, dateTo?: string): Promise<VesselEventsResult> {
    const result = await this.aisService.getVesselEvents(vesselId, dateFrom, dateTo);

    return {
      vesselId,
      events: result.events.map((e) => mapToVesselEvent(e, result.freshness.status)),
      retrievedAt: new Date().toISOString(),
      source: result.freshness.source,
    };
  }
}
