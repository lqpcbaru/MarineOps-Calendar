import type { UserRecord, CreateUserParams, UpdateUserParams, UserListResult } from '../../domain';

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findAll(params: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }): Promise<UserListResult>;
  create(params: CreateUserParams): Promise<UserRecord>;
  update(id: string, params: UpdateUserParams): Promise<UserRecord>;
  disable(id: string): Promise<UserRecord>;
}
