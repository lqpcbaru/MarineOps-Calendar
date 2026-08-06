export type CacheStatus = 'FRESH' | 'STALE' | 'EXPIRED' | 'MISSING';

export function isFresh(status: CacheStatus): boolean {
  return status === 'FRESH';
}

export function isStale(status: CacheStatus): boolean {
  return status === 'STALE';
}

export function isExpired(status: CacheStatus): boolean {
  return status === 'EXPIRED';
}

export function isMissing(status: CacheStatus): boolean {
  return status === 'MISSING';
}
