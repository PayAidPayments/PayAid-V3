import { cookies, headers } from 'next/headers'
import { MarketingCommandCenter } from '@/components/marketing/home/MarketingCommandCenter'
import type { EnrichedData, AnalyticsData, CampaignRow, CommandCenterData } from '@/lib/marketing/marketing-home-types'

export type { EnrichedData, AnalyticsData, CampaignRow, CommandCenterData }

interface PageProps {
  params: Promise<{ tenantId: string }>
}

async function fetchJson<T>(url: string, cookieHeader: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export default async function MarketingHomePage({ params }: PageProps) {
  const { tenantId } = await params

  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const base = `${protocol}://${host}`

  const [enriched, analytics, campaignsRes, commandCenter] = await Promise.all([
    fetchJson<EnrichedData>(`${base}/api/marketing/dashboard/enriched`, cookieHeader),
    fetchJson<AnalyticsData>(`${base}/api/marketing/analytics`, cookieHeader),
    fetchJson<{ campaigns: CampaignRow[] }>(`${base}/api/marketing/campaigns?limit=10`, cookieHeader),
    fetchJson<CommandCenterData>(`${base}/api/marketing/home/command-center`, cookieHeader),
  ])

  return (
    <MarketingCommandCenter
      tenantId={tenantId}
      enriched={enriched}
      analytics={analytics}
      campaigns={campaignsRes?.campaigns ?? []}
      commandCenter={commandCenter}
    />
  )
}
