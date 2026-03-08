/**
 * DND (Do Not Disturb) Checking Service
 * TRAI compliance: check if a phone number is registered in India's DND registry.
 *
 * Optional env: DND_API_URL (e.g. https://example.com/dnd/api?number=), DND_API_KEY
 * Free options: manthanitsolutions.com/dnd/api (1000/day), or self-host dndchecker.
 */

export interface DNDCheckResult {
  isDND: boolean
  status: 'allowed' | 'blocked' | 'partial' | 'unknown'
  category?: string
  message?: string
}

/** Normalize to 10-digit Indian number for API/local list */
export function normalizeIndianNumber(phoneNumber: string): string | null {
  const cleaned = phoneNumber.replace(/[^\d]/g, '')
  if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.slice(2)
  if (cleaned.length === 10) return cleaned
  return null
}

/**
 * Check DND status for a phone number.
 * 1. Local DND list (if any)
 * 2. External DND API when DND_API_URL is set
 * 3. Default: allowed (fallback when no API)
 */
export async function checkDNDStatus(phoneNumber: string): Promise<DNDCheckResult> {
  try {
    const indianNumber = normalizeIndianNumber(phoneNumber)
    if (!indianNumber) {
      return {
        isDND: false,
        status: 'unknown',
        message: 'Invalid Indian phone number format',
      }
    }

    const localDNDList = await getLocalDNDList()
    if (localDNDList.includes(indianNumber)) {
      return {
        isDND: true,
        status: 'blocked',
        category: 'local',
        message: 'Number found in local DND list',
      }
    }

    const apiUrl = process.env.DND_API_URL
    const apiKey = process.env.DND_API_KEY
    if (apiUrl) {
      const result = await checkDNDViaAPI(indianNumber, apiUrl, apiKey)
      if (result) return result
    }

    return {
      isDND: false,
      status: 'allowed',
      message: 'Number not found in DND registry',
    }
  } catch (error) {
    console.error('DND check failed:', error)
    return {
      isDND: false,
      status: 'unknown',
      message: 'DND check service unavailable',
    }
  }
}

/**
 * Call external DND API. Expects JSON: { dnd: boolean } or { status: "blocked"|"allowed" } or similar.
 * GET DND_API_URL + number (if URL has ?) or DND_API_URL with number as query param.
 */
async function checkDNDViaAPI(
  indianNumber: string,
  baseUrl: string,
  apiKey?: string
): Promise<DNDCheckResult | null> {
  try {
    const url = baseUrl.includes('?')
      ? `${baseUrl.replace(/&?$/, '')}${baseUrl.endsWith('=') ? '' : '&'}number=${indianNumber}`
      : `${baseUrl}?number=${indianNumber}`
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    const isDND = data.dnd === true || data.status === 'blocked' || data.DND === true
    return {
      isDND: !!isDND,
      status: isDND ? 'blocked' : 'allowed',
      category: 'api',
      message: isDND ? 'Number in DND registry' : 'Number not in DND registry',
    }
  } catch {
    return null
  }
}

/**
 * Get local DND list (from database or cache)
 */
async function getLocalDNDList(): Promise<string[]> {
  try {
    // In production, fetch from database
    // For now, return empty array
    return []
  } catch (error) {
    console.error('Failed to get local DND list:', error)
    return []
  }
}

/**
 * Add number to local DND list
 */
export async function addToDNDList(phoneNumber: string, reason?: string): Promise<void> {
  try {
    // In production, save to database
    // This is a placeholder
    console.log(`Adding ${phoneNumber} to DND list. Reason: ${reason || 'User requested'}`)
  } catch (error) {
    console.error('Failed to add to DND list:', error)
    throw error
  }
}

/**
 * Remove number from local DND list
 */
export async function removeFromDNDList(phoneNumber: string): Promise<void> {
  try {
    // In production, remove from database
    // This is a placeholder
    console.log(`Removing ${phoneNumber} from DND list`)
  } catch (error) {
    console.error('Failed to remove from DND list:', error)
    throw error
  }
}

