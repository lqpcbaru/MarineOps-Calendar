export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: 'ACTIVE' | 'DISABLED';
  timezone: string;
  locale: string;
  roleIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserParams {
  email: string;
  name: string;
  passwordHash: string;
  timezone?: string;
  locale?: string;
  roleIds: string[];
}

export interface UpdateUserParams {
  name?: string;
  timezone?: string;
  locale?: string;
  roleIds?: string[];
}

export interface UserListResult {
  users: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
}
