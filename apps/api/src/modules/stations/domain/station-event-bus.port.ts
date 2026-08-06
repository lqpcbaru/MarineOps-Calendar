import type { StationDomainEvent } from './station.events';

export interface StationEventBus {
  publish(event: StationDomainEvent): Promise<void> | void;
}
