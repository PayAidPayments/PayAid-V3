export type LeadDiscoveryQuery = {
  q: string
  industry: string
  country: string
  limit: number
}

export const DEFAULT_DISCOVERY_LIMIT = 25
export const MAX_DISCOVERY_LIMIT = 100

export function parsePositiveInt(raw: string | null, fallback: number): number {
  const num = Number(raw)
  if (!Number.isFinite(num) || num <= 0) return fallback
  return Math.floor(num)
}

export function parseDiscoveryQuery(searchParams: URLSearchParams): LeadDiscoveryQuery {
  const q = (searchParams.get('q') || '').trim()
  const industry = (searchParams.get('industry') || '').trim()
  const country = (searchParams.get('country') || '').trim()
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), DEFAULT_DISCOVERY_LIMIT), MAX_DISCOVERY_LIMIT)
  return { q, industry, country, limit }
}

export function buildAccountDiscoveryWhere(tenantId: string, query: Omit<LeadDiscoveryQuery, 'limit'>) {
  const { q, industry, country } = query
  return {
    tenantId,
    ...(industry ? { industry: { contains: industry, mode: 'insensitive' as const } } : {}),
    ...(country ? { country: { contains: country, mode: 'insensitive' as const } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { industry: { contains: q, mode: 'insensitive' as const } },
            { website: { contains: q, mode: 'insensitive' as const } },
            { city: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }
}

export function normalizeDiscoveryAccountRow(row: {
  id: string
  name: string
  industry: string | null
  website: string | null
  city: string | null
  state: string | null
  country: string | null
  employeeCount: number | null
  updatedAt: Date
}) {
  return {
    id: row.id,
    companyName: row.name,
    industry: row.industry,
    website: row.website,
    location: [row.city, row.state, row.country].filter(Boolean).join(', ') || null,
    employeeCount: row.employeeCount,
    source: 'crm-account-index',
    updatedAt: row.updatedAt,
  }
}
