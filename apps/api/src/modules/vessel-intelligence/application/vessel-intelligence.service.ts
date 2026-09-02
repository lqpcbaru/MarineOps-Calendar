import { Injectable } from '@nestjs/common';
import type { VesselSearchResult, VesselEventsResult, VesselProfile } from '../domain';
import { mapToVesselSummary, mapToVesselEvent, mapToVesselProfile } from '../domain';
import { AisService } from '../../ais/application/ais.service';
import { searchVesselsQuerySchema, vesselEventsQuerySchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class VesselIntelligenceService {
  constructor(private readonly aisService: AisService) {}

  async searchVessels(query: string, page = 1, pageSize = 20): Promise<VesselSearchResult> {
    // Validate here rather than in the controller: these endpoints are
    // public and unauthenticated, and the values reach a third-party API
    // and the cache key. See dtos.ts for what was previously unbounded.
    const valid = searchVesselsQuerySchema.safeParse({ q: query, page, pageSize });
    if (!valid.success) throw new ValidationError('Parameter carian kapal tidak sah');

    const result = await this.aisService.searchVessels(
      valid.data.q,
      valid.data.page,
      valid.data.pageSize,
    );
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

  async getVesselEvents(
    vesselId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<VesselEventsResult> {
    const valid = vesselEventsQuerySchema.safeParse({ dateFrom, dateTo });
    if (!valid.success) throw new ValidationError('Julat tarikh kapal tidak sah');

    const result = await this.aisService.getVesselEvents(
      vesselId,
      valid.data.dateFrom,
      valid.data.dateTo,
    );

    return {
      vesselId,
      events: result.events.map((e) => mapToVesselEvent(e, result.freshness.status)),
      retrievedAt: new Date().toISOString(),
      source: result.freshness.source,
    };
  }
}
