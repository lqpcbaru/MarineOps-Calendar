import { DomainError } from '../../../shared-kernel';

export class RoleNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Role '${id}' not found`, 'ROLE_NOT_FOUND');
  }
}

export class RoleNameExistsError extends DomainError {
  constructor(name: string) {
    super(`Role '${name}' already exists`, 'ROLE_NAME_EXISTS');
  }
}

export class RoleHasUsersError extends DomainError {
  constructor(roleId: string, count: number) {
    super(`Role has ${count} assigned user(s); reassign before deleting`, 'ROLE_HAS_USERS');
  }
}
