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
