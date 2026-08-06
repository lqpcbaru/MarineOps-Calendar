export interface StationCreatedEvent {
  type: 'StationCreated';
  stationId: string;
  stationCode: string;
  stationName: string;
  at: Date;
}

export interface StationUpdatedEvent {
  type: 'StationUpdated';
  stationId: string;
  at: Date;
}

export interface StationArchivedEvent {
  type: 'StationArchived';
  stationId: string;
  at: Date;
}

export type StationDomainEvent =
  | StationCreatedEvent
  | StationUpdatedEvent
  | StationArchivedEvent;
