import { z } from 'zod';

export const createRoleCommandSchema = z.object({
  name: z.string().min(1).max(128),
  permissionCodes: z.array(z.string()).min(1),
});
export type CreateRoleCommand = z.infer<typeof createRoleCommandSchema>;

export const updateRoleCommandSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  permissionCodes: z.array(z.string()).optional(),
});
export type UpdateRoleCommand = z.infer<typeof updateRoleCommandSchema>;
