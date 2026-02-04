// Track ongoing seed operations to prevent concurrent seeding
const ongoingSeeds = new Map<string, { startTime: number; promise: Promise<any> }>()
const SEED_TIMEOUT_MS = 300000 // 5 minutes max for comprehensive seed

/**
 * Check if a seed operation is currently running for a tenant
 */
export function isSeedRunning(tenantId?: string): { running: boolean; elapsed?: number } {
  if (!tenantId) {
    // Check if any seed is running
    for (const [tid, seed] of ongoingSeeds.entries()) {
      const elapsed = Date.now() - seed.startTime
      if (elapsed < SEED_TIMEOUT_MS) {
        return { running: true, elapsed }
      }
    }
    return { running: false }
  }
  
  const seed = ongoingSeeds.get(tenantId)
  if (!seed) {
    return { running: false }
  }
  
  const elapsed = Date.now() - seed.startTime
  if (elapsed >= SEED_TIMEOUT_MS) {
    ongoingSeeds.delete(tenantId)
    return { running: false }
  }
  
  return { running: true, elapsed }
}

/**
 * Start tracking a seed operation
 */
export function startSeedTracking(tenantId: string, promise: Promise<any>): void {
  ongoingSeeds.set(tenantId, {
    startTime: Date.now(),
    promise,
  })
  
  // Clean up when promise completes
  promise
    .then(() => {
      ongoingSeeds.delete(tenantId)
    })
    .catch(() => {
      // Also clean up on error
      ongoingSeeds.delete(tenantId)
    })
}

/**
 * Stop tracking a seed operation
 */
export function stopSeedTracking(tenantId: string): void {
  ongoingSeeds.delete(tenantId)
}

/**
 * Get all running seeds
 */
export function getRunningSeeds(): Array<{ tenantId: string; elapsed: number }> {
  const running: Array<{ tenantId: string; elapsed: number }> = []
  const now = Date.now()
  
  for (const [tenantId, seed] of ongoingSeeds.entries()) {
    const elapsed = now - seed.startTime
    if (elapsed < SEED_TIMEOUT_MS) {
      running.push({ tenantId, elapsed })
    } else {
      // Clean up expired seeds
      ongoingSeeds.delete(tenantId)
    }
  }
  
  return running
}
