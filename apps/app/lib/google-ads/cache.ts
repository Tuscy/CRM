import type { GoogleAdsDashboard } from "./types";

const TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
  data: GoogleAdsDashboard;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

export function cacheKey(customerId: string, days: number): string {
  return `${customerId}:${days}`;
}

export function getCachedDashboard(
  customerId: string,
  days: number
): GoogleAdsDashboard | null {
  const key = cacheKey(customerId, days);
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return { ...entry.data, cachedAt: new Date(entry.expiresAt - TTL_MS).toISOString() };
}

export function setCachedDashboard(
  customerId: string,
  days: number,
  data: GoogleAdsDashboard
): void {
  memoryCache.set(cacheKey(customerId, days), {
    data,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function clearDashboardCache(customerId?: string): void {
  if (!customerId) {
    memoryCache.clear();
    return;
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(`${customerId}:`)) memoryCache.delete(key);
  }
}
