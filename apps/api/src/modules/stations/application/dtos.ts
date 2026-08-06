import { z } from 'zod';

export const createStationSchema = z.object({
  code: z.string().min(1).max(32).regex(/^[A-Z0-9-]+$/, 'Kod stesen mestilah huruf besar, nombor, atau sengkang'),
  name: z.string().min(1).max(256),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  regionId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type CreateStationCommand = z.infer<typeof createStationSchema>;

export const updateStationSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().min(1).optional(),
  regionId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
export type UpdateStationCommand = z.infer<typeof updateStationSchema>;

export const listStationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  regionId: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});
export type ListStationsQuery = z.infer<typeof listStationsQuerySchema>;
