import 'server-only'

/**
 * Runtime guard in addition to Next.js `server-only` marker.
 * Keeps accidental browser imports fail-fast in development.
 */
export function loadServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('This module can only be imported from server-side code.')
  }
}

import 'server-only'

/**
 * Centralized server-only guard for modules that must never ship to the client.
 */
export function loadServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('This module is server-only and cannot run in the browser.')
  }
}
/**
 * Next.js server boundary marker. Skipped when `PAYAID_CLI_SCRIPT=1` so `tsx` scripts can import server libs.
 */
export function loadServerOnly(): void {
  if (process.env.PAYAID_CLI_SCRIPT === '1' || process.env.PAYAID_CLI_SCRIPT === 'true') {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}
