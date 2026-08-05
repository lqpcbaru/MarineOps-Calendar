import { Injectable } from '@nestjs/common';
import { LoggingService } from '../../../platform/logging.service';
import type { DomainEventBus } from '../domain';
import type { AuthenticationDomainEvent } from '../domain';

/**
 * In-process domain event bus (SYSTEM_ARCHITECTURE §5.1).
 *
 * Phase 1: logs events and invokes synchronous handlers. When the Notifications
 * module lands (Phase 2) it will subscribe here. No external broker yet.
 */
@Injectable()
export class InProcessEventBus implements DomainEventBus {
  private readonly logger: LoggingService;

  constructor() {
    this.logger = new LoggingService('DomainEvents');
  }

  async publish(event: AuthenticationDomainEvent): Promise<void> {
    this.logger.log(event.type, { ...event });
  }
}
