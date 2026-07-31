import { DomainError } from '../../../shared-kernel';

/** Raised when email/password do not match any active user. */
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
  }
}

/** Raised when a user account is disabled and cannot authenticate (FR-USR-003). */
export class UserDisabledError extends DomainError {
  constructor(userId: string) {
    super(`User '${userId}' is disabled and cannot authenticate`, 'AUTH_USER_DISABLED');
  }
}

/** Raised when a refresh token cannot be found by its hash. */
export class RefreshTokenNotFoundError extends DomainError {
  constructor() {
    super('Refresh token not recognized', 'AUTH_REFRESH_NOT_FOUND');
  }
}

/** Raised when a refresh token is expired. */
export class RefreshTokenExpiredError extends DomainError {
  constructor() {
    super('Refresh token has expired', 'AUTH_REFRESH_EXPIRED');
  }
}

/** Raised when a refresh token has been revoked/replaced and is presented again. */
export class RefreshTokenReusedError extends DomainError {
  constructor() {
    super(
      'Refresh token reuse detected; token family invalidated',
      'AUTH_REFRESH_REUSE_DETECTED',
    );
  }
}

/** Raised when an access token is missing or invalid on a protected route. */
export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'AUTH_UNAUTHORIZED');
  }
}

/** Raised when the authenticated principal lacks a required permission. */
export class ForbiddenError extends DomainError {
  constructor(permission: string) {
    super(`Missing required permission: ${permission}`, 'AUTH_FORBIDDEN');
  }
}
