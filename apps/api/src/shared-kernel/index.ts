export type DomainId = string & { readonly __brand: 'DomainId' };

export function createId(): DomainId {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID() as DomainId;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as DomainId;
}

export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function success<T>(value: T): Result<T> {
  return { success: true, value };
}

export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}
