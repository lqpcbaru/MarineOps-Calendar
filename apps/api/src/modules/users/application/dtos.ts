import { z } from 'zod';

export const createUserCommandSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(256),
  password: z.string().min(8).max(256),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  roleIds: z.array(z.string()).min(1),
});
export type CreateUserCommand = z.infer<typeof createUserCommandSchema>;

export const updateUserCommandSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});
export type UpdateUserCommand = z.infer<typeof updateUserCommandSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  search: z.string().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
