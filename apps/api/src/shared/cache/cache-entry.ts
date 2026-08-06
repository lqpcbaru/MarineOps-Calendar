export interface CacheEntry<T> {
  key: string;
  provider: string;
  stationId: string;
  data: T;
  createdAt: Date;
  expiresAt: Date;
  version: number;
}
