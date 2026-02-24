/**
 * Shiprocket API client (India shipping).
 * Env: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD or SHIPROCKET_TOKEN.
 * Token valid 10 days; prefer SHIPROCKET_TOKEN when set.
 */

const BASE = 'https://apiv2.shiprocket.in/v1/external'

let cachedToken: string | null = null
let cachedExpiry = 0

async function getToken(): Promise<string> {
  const token = process.env.SHIPROCKET_TOKEN
  if (token && token.trim()) return token.trim()

  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD
  if (!email || !password) {
    throw new Error('Shiprocket: set SHIPROCKET_TOKEN or SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD')
  }

  if (cachedToken && Date.now() < cachedExpiry) return cachedToken

  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shiprocket login failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { token?: string }
  cachedToken = data.token || null
  cachedExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000 // 9 days
  if (!cachedToken) throw new Error('Shiprocket login returned no token')
  return cachedToken
}

export interface ShiprocketRateRequest {
  pickup_postcode: string
  delivery_postcode: string
  weight: number // kg
  length?: number // cm
  width?: number
  height?: number
}

export interface ShiprocketRateOption {
  courier_company_id: number
  courier_name: string
  etd: string
  rate: number
  freight_charge?: number
  cod_charges?: number
}

/**
 * Get courier serviceability and rates (₹).
 */
export async function getShiprocketRates(
  params: ShiprocketRateRequest
): Promise<{ success: boolean; data?: { available_courier_companies?: ShiprocketRateOption[] }; message?: string }> {
  try {
    const token = await getToken()
    const q = new URLSearchParams({
      pickup_postcode: params.pickup_postcode,
      delivery_postcode: params.delivery_postcode,
      weight: String(params.weight),
    })
    if (params.length != null) q.set('length', String(params.length))
    if (params.width != null) q.set('width', String(params.width))
    if (params.height != null) q.set('height', String(params.height))

    const res = await fetch(`${BASE}/courier/serviceability/?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: (data as { message?: string }).message || res.statusText }
    return { success: true, data: data as { available_courier_companies?: ShiprocketRateOption[] } }
  } catch (e) {
    console.warn('Shiprocket rates error:', e)
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/**
 * Get lowest rate in INR for a given weight and postcodes. Returns null if not configured or error.
 */
export async function getLowestRateInr(
  pickupPostcode: string,
  deliveryPostcode: string,
  weightKg: number
): Promise<number | null> {
  const result = await getShiprocketRates({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    weight: weightKg,
  })
  if (!result.success || !result.data?.available_courier_companies?.length) return null
  const rates = result.data.available_courier_companies
  const min = Math.min(...rates.map((r) => r.rate || r.freight_charge || 0))
  return min > 0 ? min : null
}
