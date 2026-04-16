export function withRetryGuidance(message: string): string {
  const normalized = message.toLowerCase()

  const isDbPoolBusy =
    normalized.includes('connection pool') ||
    normalized.includes('timed out fetching a new connection') ||
    normalized.includes('database server') ||
    normalized.includes('connectionreset') ||
    normalized.includes('econnreset') ||
    normalized.includes('forcibly closed')

  const isTimedOut =
    normalized.includes('timed out') ||
    normalized.includes('timeout') ||
    normalized.includes('aborted')

  if (isDbPoolBusy || isTimedOut) {
    return `${message} The system is currently busy. Please retry in 10-20 seconds.`
  }

  return message
}

export async function parseErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const body = await response.json().catch(() => ({}))
  const raw =
    (typeof body?.error === 'string' && body.error) ||
    (typeof body?.message === 'string' && body.message) ||
    fallbackMessage
  return withRetryGuidance(raw)
}
