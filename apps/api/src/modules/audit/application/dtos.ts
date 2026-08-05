import { z } from 'zod';

export const listAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  entityType: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
