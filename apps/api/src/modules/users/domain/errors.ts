import { DomainError } from '../../../shared-kernel';

export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super(`User '${id}' not found`, 'USER_NOT_FOUND');
  }
}

export class UserEmailExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, 'USER_EMAIL_EXISTS');
  }
}

export class UserStatusError extends DomainError {
  constructor(userId: string, message: string) {
    super(`User '${userId}': ${message}`, 'USER_STATUS_ERROR');
  }
}
