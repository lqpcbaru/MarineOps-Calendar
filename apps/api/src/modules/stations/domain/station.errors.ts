import { DomainError } from '../../../shared-kernel';

export class StationNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Stesen '${id}' tidak dijumpai`, 'STATION_NOT_FOUND');
  }
}

export class StationCodeExistsError extends DomainError {
  constructor(code: string) {
    super(`Kod stesen '${code}' sudah wujud`, 'STATION_CODE_EXISTS');
  }
}

export class RegionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Kawasan operasi '${id}' tidak dijumpai`, 'REGION_NOT_FOUND');
  }
}

export class RegionCodeExistsError extends DomainError {
  constructor(code: string) {
    super(`Kod kawasan '${code}' sudah wujud`, 'REGION_CODE_EXISTS');
  }
}

export class StationArchivedError extends DomainError {
  constructor(id: string) {
    super(`Stesen '${id}' telah diarkibkan`, 'STATION_ARCHIVED');
  }
}
