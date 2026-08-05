import type { UserRecord, CreateUserParams, UpdateUserParams, UserListResult } from '../domain';
import type { UserRepository } from '../application/ports';

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, UserRecord>();

  seed(users: UserRecord[]): void {
    for (const u of users) {
      this.byId.set(u.id, u);
      this.byEmail.set(u.email, u);
    }
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email) ?? null;
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }): Promise<UserListResult> {
    let users = [...this.byId.values()];
    if (params.status) users = users.filter((u) => u.status === params.status);
    if (params.search) {
      const s = params.search.toLowerCase();
      users = users.filter(
        (u) => u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s),
      );
    }
    const total = users.length;
    const start = (params.page - 1) * params.pageSize;
    return {
      users: users.slice(start, start + params.pageSize),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async create(params: CreateUserParams): Promise<UserRecord> {
    const record: UserRecord = {
      id: `user-${this.byId.size + 1}`,
      email: params.email,
      name: params.name,
      passwordHash: params.passwordHash,
      status: 'ACTIVE',
      timezone: params.timezone || 'UTC',
      locale: params.locale || 'en',
      roleIds: params.roleIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.byId.set(record.id, record);
    this.byEmail.set(record.email, record);
    return record;
  }

  async update(id: string, params: UpdateUserParams): Promise<UserRecord> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error('not found');
    const updated: UserRecord = {
      ...existing,
      name: params.name ?? existing.name,
      timezone: params.timezone ?? existing.timezone,
      locale: params.locale ?? existing.locale,
      roleIds: params.roleIds ?? existing.roleIds,
      updatedAt: new Date(),
    };
    this.byId.set(id, updated);
    if (params.name || params.roleIds) {
      this.byEmail.set(updated.email, updated);
    }
    return updated;
  }

  async disable(id: string): Promise<UserRecord> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error('not found');
    const disabled: UserRecord = { ...existing, status: 'DISABLED', updatedAt: new Date() };
    this.byId.set(id, disabled);
    this.byEmail.set(disabled.email, disabled);
    return disabled;
  }
}
