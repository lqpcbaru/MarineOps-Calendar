import { Controller, Get, Query } from '@nestjs/common';
import { OperationalCalendarService } from '../../modules/operational-calendar/application/operational-calendar.service';
import type { CalendarResponse } from '../../modules/operational-calendar/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('calendar')
@Public()
export class PublicCalendarController {
  constructor(private readonly calendarService: OperationalCalendarService) {}

  @Get()
  async getCalendar(
    @Query('stationId') stationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<CalendarResponse> {
    return this.calendarService.getCalendar(stationId || '—', dateFrom, dateTo);
  }
}
