import { Module } from '@nestjs/common';
import { VesselIntelligenceService } from '../application/vessel-intelligence.service';
import { AisModule } from '../../ais/api/ais.module';

@Module({
  imports: [AisModule],
  providers: [VesselIntelligenceService],
  exports: [VesselIntelligenceService],
})
export class VesselIntelligenceModule {}
