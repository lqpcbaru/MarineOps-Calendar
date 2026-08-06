export interface CachePolicyConfig {
  ttlMs: number;
  staleTtlMs: number;
}

export function createCachePolicy(overrides: Partial<CachePolicyConfig> = {}): CachePolicyConfig {
  return {
    ttlMs: 30 * 60 * 1000,
    staleTtlMs: 120 * 60 * 1000,
    ...overrides,
  };
}

export function isCacheHit(createdAt: Date, ttlMs: number, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < ttlMs;
}

export function isCacheStale(createdAt: Date, ttlMs: number, staleTtlMs: number, now: Date = new Date()): boolean {
  const age = now.getTime() - createdAt.getTime();
  return age >= ttlMs && age < staleTtlMs;
}

export function isCacheExpired(createdAt: Date, staleTtlMs: number, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() >= staleTtlMs;
}

export function buildCacheKey(provider: string, dataType: string, stationId: string, date: string): string {
  return `${provider}:${dataType}:${stationId}:${date}`;
}
