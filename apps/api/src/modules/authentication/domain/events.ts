/**
 * Authentication domain events (DOMAIN_MODEL §7).
 *
 * Consumed in-process by Audit and (later) Notifications modules.
 */
export interface UserLoggedInEvent {
  type: 'UserLoggedIn';
  userId: string;
  at: Date;
}

export interface RefreshTokenRotatedEvent {
  type: 'RefreshTokenRotated';
  userId: string;
  revokedTokenId: string;
  newTokenId: string;
  at: Date;
}

export interface RefreshTokenReusedEvent {
  /** Emitted when a revoked token is presented again → family invalidated (theft signal). */
  type: 'RefreshTokenReused';
  userId: string;
  familyId: string;
  at: Date;
}

export interface UserLoggedOutEvent {
  type: 'UserLoggedOut';
  userId: string;
  at: Date;
}

export type AuthenticationDomainEvent =
  | UserLoggedInEvent
  | RefreshTokenRotatedEvent
  | RefreshTokenReusedEvent
  | UserLoggedOutEvent;
