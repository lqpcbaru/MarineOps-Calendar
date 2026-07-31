import type { AuthenticationDomainEvent } from './events';

/**
 * In-process domain event bus (SYSTEM_ARCHITECTURE §5.1).
 * Port defined in domain; implemented in infrastructure. Domain remains pure.
 */
export interface DomainEventBus {
  publish(event: AuthenticationDomainEvent): Promise<void> | void;
}
