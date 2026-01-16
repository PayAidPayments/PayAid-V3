/**
 * Performance monitoring and optimization utilities
 * Helps identify and mitigate performance issues
 */

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let previous = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * Debounce function to delay execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func.apply(this, args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Batch DOM reads to avoid forced reflows
 * Use this when you need to read multiple layout properties
 */
export function batchReads<T>(callback: () => T): T {
  // Force a layout calculation first to batch all reads
  if (typeof document !== 'undefined') {
    document.body.offsetHeight // Trigger layout
  }
  return callback()
}

/**
 * Batch DOM writes to avoid forced reflows
 * Use requestAnimationFrame to batch writes
 */
export function batchWrites(callback: () => void): void {
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    requestAnimationFrame(callback)
  } else {
    setTimeout(callback, 0)
  }
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return fn()
  }

  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const duration = end - start

  // Log if it takes longer than 50ms (potential performance issue)
  if (duration > 50) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Monitor long tasks (tasks that take > 50ms)
 */
export function monitorLongTasks(): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {}
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(
            `[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`,
            entry
          )
        }
      }
    })

    observer.observe({ entryTypes: ['measure', 'navigation'] })

    return () => observer.disconnect()
  } catch (error) {
    console.warn('[Performance] Long task monitoring not supported')
    return () => {}
  }
}

/**
 * Defer execution until browser is idle
 */
export function deferUntilIdle(
  callback: () => void,
  timeout: number = 2000
): void {
  if (typeof window === 'undefined') {
    callback()
    return
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 0)
  }
}






