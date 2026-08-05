import type { RoleRecord } from '../../domain';

export interface RoleRepository {
  findById(id: string): Promise<RoleRecord | null>;
  findByName(name: string): Promise<RoleRecord | null>;
  findAll(): Promise<RoleRecord[]>;
  create(params: { name: string; permissionCodes: string[] }): Promise<RoleRecord>;
  update(id: string, params: { name?: string; permissionCodes?: string[] }): Promise<RoleRecord>;
  delete(id: string): Promise<void>;
  getUserCount(roleId: string): Promise<number>;
}
