export const COMPILER_CACHE_NAME = 'pocket-cpp-compiler-v1';

export const COMPILER_ASSETS = [
  '/clang/bundle.js',
  '/clang/llvm-resources.tar',
  '/clang/llvm.core.wasm',
  '/clang/llvm.core2.wasm',
  '/clang/llvm.core3.wasm',
  '/clang/llvm.core4.wasm',
];

export interface CacheProgress {
  assetIndex: number;
  totalAssets: number;
  currentAsset: string;
  loadedBytes: number;
  totalBytes: number;
  percent: number;
}

export async function isCompilerCached(): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(COMPILER_CACHE_NAME);
    for (const asset of COMPILER_ASSETS) {
      const match = await cache.match(asset);
      if (!match) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function cacheCompilerAssets(
  onProgress?: (progress: CacheProgress) => void
): Promise<void> {
  if (!('caches' in window)) {
    throw new Error('Cache Storage API is not supported in this browser environment');
  }

  const cache = await caches.open(COMPILER_CACHE_NAME);
  let totalBytesEstimated = 105 * 1024 * 1024; // Approx 105 MB total
  let cumulativeLoaded = 0;

  for (let i = 0; i < COMPILER_ASSETS.length; i++) {
    const assetUrl = COMPILER_ASSETS[i];
    
    // Check if already in cache
    const existing = await cache.match(assetUrl);
    if (existing) {
      const blob = await existing.blob();
      cumulativeLoaded += blob.size;
      continue;
    }

    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Failed to download compiler asset ${assetUrl}: HTTP ${response.status}`);
    }

    const contentLength = +(response.headers.get('content-length') || '0');
    if (contentLength > 0 && i === 0) {
      // Adjust total estimate if needed
    }

    if (!response.body) {
      const blob = await response.blob();
      await cache.put(assetUrl, new Response(blob));
      cumulativeLoaded += blob.size;
      if (onProgress) {
        onProgress({
          assetIndex: i + 1,
          totalAssets: COMPILER_ASSETS.length,
          currentAsset: assetUrl.split('/').pop() || assetUrl,
          loadedBytes: cumulativeLoaded,
          totalBytes: totalBytesEstimated,
          percent: Math.min(100, Math.round((cumulativeLoaded / totalBytesEstimated) * 100)),
        });
      }
      continue;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let assetLoaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        assetLoaded += value.length;
        cumulativeLoaded += value.length;
        if (onProgress) {
          onProgress({
            assetIndex: i + 1,
            totalAssets: COMPILER_ASSETS.length,
            currentAsset: assetUrl.split('/').pop() || assetUrl,
            loadedBytes: cumulativeLoaded,
            totalBytes: totalBytesEstimated,
            percent: Math.min(100, Math.round((cumulativeLoaded / totalBytesEstimated) * 100)),
          });
        }
      }
    }

    // Combine chunks and cache
    const combined = new Uint8Array(assetLoaded);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const cachedResponse = new Response(combined, {
      headers: {
        'Content-Type': assetUrl.endsWith('.wasm')
          ? 'application/wasm'
          : assetUrl.endsWith('.tar')
          ? 'application/x-tar'
          : 'application/javascript',
      },
    });

    await cache.put(assetUrl, cachedResponse);
  }
}

export async function clearCompilerCache(): Promise<boolean> {
  if (!('caches' in window)) return false;
  return caches.delete(COMPILER_CACHE_NAME);
}

export async function getStorageEstimate(): Promise<{
  quotaMb: number;
  usageMb: number;
  percent: number;
  isPersistent: boolean;
}> {
  if (!('storage' in navigator) || !navigator.storage.estimate) {
    return { quotaMb: 0, usageMb: 0, percent: 0, isPersistent: false };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const isPersistent = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;

    return {
      quotaMb: Math.round(quota / (1024 * 1024)),
      usageMb: Math.round(usage / (1024 * 1024)),
      percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
      isPersistent,
    };
  } catch {
    return { quotaMb: 0, usageMb: 0, percent: 0, isPersistent: false };
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}
