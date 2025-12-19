/**
 * Shared in-memory cache for FSEQ files
 * This allows the generate and download API routes to share data
 */

// In-memory cache for generated FSEQ files
// Key: variantId, Value: FSEQ Buffer
export const fseqCache = new Map<string, Buffer>();

// Clean up old entries after 1 hour
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  buffer: Buffer;
  timestamp: number;
}

const cacheWithTimestamps = new Map<string, CacheEntry>();

export function setFseq(variantId: string, buffer: Buffer): void {
  cacheWithTimestamps.set(variantId, {
    buffer,
    timestamp: Date.now(),
  });
  fseqCache.set(variantId, buffer);
}

export function getFseq(variantId: string): Buffer | undefined {
  const entry = cacheWithTimestamps.get(variantId);

  if (!entry) {
    return undefined;
  }

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cacheWithTimestamps.delete(variantId);
    fseqCache.delete(variantId);
    return undefined;
  }

  return entry.buffer;
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheWithTimestamps.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cacheWithTimestamps.delete(key);
      fseqCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
