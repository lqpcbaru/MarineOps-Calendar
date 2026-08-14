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
import { JwtAuthGuard } from '../../modules/authentication/api/jwt-auth.guard';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../../modules/authentication/api/permissions.guard';

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
    return this.getStation.listAdmin(query);
  }

  @Get(':id')
  @RequirePermissions('station.read')
  async getById(@Param('id') id: string) {
    const s = await this.getStation.findByIdAdmin(id);
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

  @Post()
  @RequirePermissions('station.write')
  async create(@Body() body: CreateStationCommand) {
    const s = await this.createStation.execute(body);
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

  @Patch(':id')
  @RequirePermissions('station.write')
  async update(@Param('id') id: string, @Body() body: UpdateStationCommand) {
    const s = await this.updateStation.execute(id, body);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('station.write')
  async archive(@Param('id') id: string) {
    await this.archiveStation.execute(id);
  }
}
