import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateStationUseCase } from '../../modules/stations/application/create-station.use-case';
import { UpdateStationUseCase } from '../../modules/stations/application/update-station.use-case';
import { ArchiveStationUseCase } from '../../modules/stations/application/archive-station.use-case';
import { GetStationUseCase } from '../../modules/stations/application/get-station.use-case';
import type {
  CreateStationCommand,
  UpdateStationCommand,
  ListStationsQuery,
} from '../../modules/stations/application/dtos';
import type { StationRecord } from '../../modules/stations/domain';
import { JwtAuthGuard } from '../../modules/authentication/api/jwt-auth.guard';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../../modules/authentication/api/permissions.guard';
import { CurrentPrincipal } from '../../modules/authentication/api/current-principal.decorator';
import type { AuthPrincipal } from '../../modules/authentication/domain';

@Controller('v1/stations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminStationsController {
  constructor(
    private readonly getStation: GetStationUseCase,
    private readonly createStation: CreateStationUseCase,
    private readonly updateStation: UpdateStationUseCase,
    private readonly archiveStation: ArchiveStationUseCase,
  ) {}

  @Get()
  @RequirePermissions('station.read')
  async list(@Query() query: ListStationsQuery) {
    const result = await this.getStation.listAdmin(query);
    return { ...result, stations: result.stations.map(toPublicStation) };
  }

  @Get(':id')
  @RequirePermissions('station.read')
  async getById(@Param('id') id: string) {
    const s = await this.getStation.findByIdAdmin(id);
    return toPublicStation(s);
  }

  @Post()
  @RequirePermissions('station.write')
  async create(
    @Body() body: CreateStationCommand,
    @CurrentPrincipal() principal: AuthPrincipal | undefined,
  ) {
    const s = await this.createStation.execute(body, principal?.userId ?? null);
    return toPublicStation(s);
  }

  @Patch(':id')
  @RequirePermissions('station.write')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateStationCommand,
    @CurrentPrincipal() principal: AuthPrincipal | undefined,
  ) {
    const s = await this.updateStation.execute(id, body, principal?.userId ?? null);
    return toPublicStation(s);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('station.write')
  async archive(@Param('id') id: string, @CurrentPrincipal() principal: AuthPrincipal | undefined) {
    await this.archiveStation.execute(id, principal?.userId ?? null);
  }
}

/** Explicit response shape — never forward a StationRecord to the wire as-is. */
function toPublicStation(s: StationRecord) {
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    timezone: s.timezone,
    regionId: s.regionId,
    regionName: s.regionName,
    status: s.status,
    metadata: s.metadata,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
