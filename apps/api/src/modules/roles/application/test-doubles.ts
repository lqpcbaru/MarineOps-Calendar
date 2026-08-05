import type { RoleRecord } from '../domain';
import type { RoleRepository } from '../application/ports';

export class InMemoryRoleRepository implements RoleRepository {
  private readonly byId = new Map<string, RoleRecord>();
  private readonly byName = new Map<string, RoleRecord>();
  private readonly userCounts = new Map<string, number>();

  seed(roles: RoleRecord[]): void {
    for (const r of roles) {
      this.byId.set(r.id, r);
      this.byName.set(r.name, r);
    }
  }

  setUserCount(roleId: string, count: number): void {
    this.userCounts.set(roleId, count);
  }

  async findById(id: string): Promise<RoleRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    return this.byName.get(name) ?? null;
  }

  async findAll(): Promise<RoleRecord[]> {
    return [...this.byId.values()];
  }

  async create(params: { name: string; permissionCodes: string[] }): Promise<RoleRecord> {
    const record: RoleRecord = {
      id: `role-${this.byId.size + 1}`,
      name: params.name,
      permissionCodes: params.permissionCodes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.byId.set(record.id, record);
    this.byName.set(record.name, record);
    return record;
  }

  async update(
    id: string,
    params: { name?: string; permissionCodes?: string[] },
  ): Promise<RoleRecord> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error('not found');
    const updated: RoleRecord = {
      ...existing,
      name: params.name ?? existing.name,
      permissionCodes: params.permissionCodes ?? existing.permissionCodes,
      updatedAt: new Date(),
    };
    if (params.name && params.name !== existing.name) {
      this.byName.delete(existing.name);
      this.byName.set(updated.name, updated);
    }
    this.byId.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.byId.get(id);
    if (existing) {
      this.byId.delete(id);
      this.byName.delete(existing.name);
    }
  }

  async getUserCount(roleId: string): Promise<number> {
    return this.userCounts.get(roleId) ?? 0;
  }
}
