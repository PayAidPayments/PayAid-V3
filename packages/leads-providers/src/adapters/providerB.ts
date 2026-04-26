import type { CompanyCandidate, CompanyDiscoveryRequest, ContactCandidate, ContactDiscoveryRequest } from '@payaid/leads-core'
import type { LeadSourceAdapter } from '../base/LeadSourceAdapter'

interface ProviderBCompanyPayload {
  id?: string
  externalId?: string
  name?: string
  companyName?: string
  domain?: string
  website?: string
  websiteUrl?: string
  linkedin?: string
  linkedinUrl?: string
  country?: string
  region?: string
  city?: string
  employeeCount?: number | string
  employeeBand?: string
  revenueBand?: string
  industry?: string
  subIndustry?: string
  technologies?: unknown
  confidence?: number | string
  sourceUrl?: string
  signals?: unknown
}

interface ProviderBContactPayload {
  id?: string
  externalId?: string
  fullName?: string
  name?: string
  firstName?: string
  lastName?: string
  title?: string
  seniority?: string
  department?: string
  linkedin?: string
  linkedinUrl?: string
  workEmail?: string
  email?: string
  emailConfidence?: number | string
  phone?: string
  phoneConfidence?: number | string
  sourceUrl?: string
}

export class ProviderBAdapter implements LeadSourceAdapter {
  name = 'provider-b'

  async discoverCompanies(input: CompanyDiscoveryRequest): Promise<CompanyCandidate[]> {
    const baseUrl = process.env.PROVIDER_B_BASE_URL?.trim()
    const apiKey = process.env.PROVIDER_B_API_KEY?.trim()
    const timeoutMs = Math.max(1000, Number(process.env.PROVIDER_B_TIMEOUT_MS ?? '10000'))

    if (!baseUrl || !apiKey) {
      return []
    }

    const endpoint = new URL('/api/v1/discovery/companies', baseUrl)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'x-provider': this.name,
        },
        body: JSON.stringify({
          tenantId: input.orgId,
          briefId: input.briefId,
          segmentId: input.segmentId,
          searchMode: input.searchMode,
          pagination: {
            cursor: input.cursor,
            limit: input.limit,
          },
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        return []
      }

      const data: unknown = await response.json()
      const items = extractCompanyArray(data)
      return items.map((item) => normalizeCompany(item, this.name)).filter((item): item is CompanyCandidate => Boolean(item))
    } catch {
      return []
    } finally {
      clearTimeout(timeout)
    }
  }

  async enrichCompany(): Promise<CompanyCandidate | null> {
    return null
  }

  async findContacts(input: ContactDiscoveryRequest): Promise<ContactCandidate[]> {
    const baseUrl = process.env.PROVIDER_B_BASE_URL?.trim()
    const apiKey = process.env.PROVIDER_B_API_KEY?.trim()
    const timeoutMs = Math.max(1000, Number(process.env.PROVIDER_B_TIMEOUT_MS ?? '10000'))

    if (!baseUrl || !apiKey) {
      return []
    }

    const endpoint = new URL('/api/v1/discovery/contacts', baseUrl)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'x-provider': this.name,
        },
        body: JSON.stringify({
          tenantId: input.orgId,
          accountId: input.accountId,
          personas: input.personas,
          limit: input.limit,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        return []
      }

      const data: unknown = await response.json()
      const items = extractContactArray(data)
      return items.map((item) => normalizeContact(item, this.name)).filter((item): item is ContactCandidate => Boolean(item))
    } catch {
      return []
    } finally {
      clearTimeout(timeout)
    }
  }

  async enrichContact(input: { orgId: string; contactId: string }): Promise<ContactCandidate | null> {
    const baseUrl = process.env.PROVIDER_B_BASE_URL?.trim()
    const apiKey = process.env.PROVIDER_B_API_KEY?.trim()
    const timeoutMs = Math.max(1000, Number(process.env.PROVIDER_B_TIMEOUT_MS ?? '10000'))

    if (!baseUrl || !apiKey) {
      return null
    }

    const endpoint = new URL('/api/v1/enrich/contact', baseUrl)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'x-provider': this.name,
        },
        body: JSON.stringify({
          tenantId: input.orgId,
          contactId: input.contactId,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        return null
      }

      const data: unknown = await response.json()
      const payload = extractSingleContact(data)
      return payload ? normalizeContact(payload, this.name) : null
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

function extractCompanyArray(data: unknown): ProviderBCompanyPayload[] {
  if (Array.isArray(data)) {
    return data as ProviderBCompanyPayload[]
  }
  if (!data || typeof data !== 'object') {
    return []
  }
  const record = data as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as ProviderBCompanyPayload[]
  if (Array.isArray(record.results)) return record.results as ProviderBCompanyPayload[]
  if (Array.isArray(record.companies)) return record.companies as ProviderBCompanyPayload[]
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) return nested.items as ProviderBCompanyPayload[]
    if (Array.isArray(nested.results)) return nested.results as ProviderBCompanyPayload[]
  }
  return []
}

function extractContactArray(data: unknown): ProviderBContactPayload[] {
  if (Array.isArray(data)) return data as ProviderBContactPayload[]
  if (!data || typeof data !== 'object') return []
  const record = data as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as ProviderBContactPayload[]
  if (Array.isArray(record.results)) return record.results as ProviderBContactPayload[]
  if (Array.isArray(record.contacts)) return record.contacts as ProviderBContactPayload[]
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) return nested.items as ProviderBContactPayload[]
    if (Array.isArray(nested.results)) return nested.results as ProviderBContactPayload[]
  }
  return []
}

function extractSingleContact(data: unknown): ProviderBContactPayload | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  if (record.contact && typeof record.contact === 'object') return record.contact as ProviderBContactPayload
  if (record.result && typeof record.result === 'object') return record.result as ProviderBContactPayload
  const fullName = asNonEmpty(record.fullName ?? record.name)
  if (!fullName) return null
  return record as ProviderBContactPayload
}

function normalizeCompany(payload: ProviderBCompanyPayload, provider: string): CompanyCandidate | null {
  const companyName = asNonEmpty(payload.companyName ?? payload.name)
  if (!companyName) {
    return null
  }

  const confidence = asNumber(payload.confidence)
  return {
    externalId: asNonEmpty(payload.externalId ?? payload.id),
    provider,
    companyName,
    domain: asNonEmpty(payload.domain),
    websiteUrl: asNonEmpty(payload.websiteUrl ?? payload.website),
    linkedinUrl: asNonEmpty(payload.linkedinUrl ?? payload.linkedin),
    country: asNonEmpty(payload.country),
    region: asNonEmpty(payload.region),
    city: asNonEmpty(payload.city),
    employeeCount: asNumber(payload.employeeCount),
    employeeBand: asNonEmpty(payload.employeeBand),
    revenueBand: asNonEmpty(payload.revenueBand),
    industry: asNonEmpty(payload.industry),
    subIndustry: asNonEmpty(payload.subIndustry),
    techStack: asStringArray(payload.technologies),
    signals: asSignalArray(payload.signals),
    confidence: confidence === undefined ? 0.5 : Math.min(1, Math.max(0, confidence)),
    sourceUrl: asNonEmpty(payload.sourceUrl),
    raw: payload,
  }
}

function normalizeContact(payload: ProviderBContactPayload, provider: string): ContactCandidate | null {
  const fullName = asNonEmpty(payload.fullName ?? payload.name)
  if (!fullName) {
    return null
  }
  return {
    externalId: asNonEmpty(payload.externalId ?? payload.id),
    provider,
    fullName,
    firstName: asNonEmpty(payload.firstName),
    lastName: asNonEmpty(payload.lastName),
    title: asNonEmpty(payload.title),
    seniority: asNonEmpty(payload.seniority),
    department: asNonEmpty(payload.department),
    linkedinUrl: asNonEmpty(payload.linkedinUrl ?? payload.linkedin),
    workEmail: asNonEmpty(payload.workEmail ?? payload.email),
    emailConfidence: asNumber(payload.emailConfidence),
    phone: asNonEmpty(payload.phone),
    phoneConfidence: asNumber(payload.phoneConfidence),
    sourceUrl: asNonEmpty(payload.sourceUrl),
    raw: payload,
  }
}

function asNonEmpty(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const normalized = value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
  return normalized.length > 0 ? normalized : undefined
}

function asSignalArray(value: unknown): Array<{ type: string; strength?: number; title?: string }> | undefined {
  if (!Array.isArray(value)) return undefined
  const normalized = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const type = asNonEmpty(record.type ?? record.name)
      if (!type) return null
      const strength = asNumber(record.strength ?? record.score)
      const title = asNonEmpty(record.title)
      return { type, strength, title }
    })
    .filter((item): item is { type: string; strength?: number; title?: string } => Boolean(item))
  return normalized.length > 0 ? normalized : undefined
}
