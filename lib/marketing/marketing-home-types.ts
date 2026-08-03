/**
 * Shared types for Marketing Home API responses.
 * Used by both the server page (app/marketing/[tenantId]/Home/page.tsx)
 * and the client Command Center component.
 */

export interface EnrichedData {
  marketingRevenue: number
  last30dRevenue: number
  revenueGrowth: number
  leadsGenerated: number
  qualifiedLeads: number
  qualifiedLeads30d: number
  conversionRate: number
  totalReach: number
  roi: number
  roas: number
  marketingSpend: number
  spendIsEstimated: boolean
  gstCompliantPct: number
  channelBreakdownPct: { whatsapp: number; email: number; facebook: number; linkedin: number }
  campaignHealth: {
    optimal: number; underperform: number; failing: number
    optimalPct: number; underperformPct: number; failingPct: number
  }
  audience: { active: number; engaged: number; highValue: number }
  monthlyRevenue: { month: string; revenue: number }[]
  channelRoi: { name: string; roi: number; revenue: number }[]
  funnelData: { leads: number; meetings: number; deals: number; dealsValue: number }
  revenuePerChannel: { email: number; whatsapp: number; sms: number }
}

export interface AnalyticsData {
  overview: {
    totalCampaigns: number
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    totalBounced: number
    totalUnsubscribed: number
    deliveryRate: number
    openRate: number
    clickRate: number
    clickThroughRate: number
    bounceRate: number
    unsubscribeRate: number
  }
  byType: {
    email: { count: number; sent: number; delivered: number; opened: number; clicked: number; openRate: number; clickRate: number }
    whatsapp: { count: number; sent: number; delivered: number; opened: number; clicked: number; openRate: number; clickRate: number }
    sms: { count: number; sent: number; delivered: number; opened: number; clicked: number; openRate: number; clickRate: number }
  }
  topCampaigns: {
    id: string; name: string; type: string
    openRate: number; clickRate: number
    sent: number; delivered: number; opened: number; clicked: number
    createdAt: string
  }[]
  monthlyTrend: {
    month: string; sent: number; delivered: number; opened: number; clicked: number; campaigns: number
  }[]
}

export interface CampaignRow {
  id: string
  name: string
  type: string
  status: string
  recipientCount: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  createdAt: string
  sentAt: string | null
  scheduledFor: string | null
  analytics: {
    sent: number; delivered: number; opened: number; clicked: number
    openRate: number; clickRate: number; clickThroughRate: number
  } | null
}

export interface CommandCenterData {
  publishing: {
    drafts: number
    scheduled: number
    awaitingApproval: number
    publishedToday: number
    failed: number
  }
  channelPerformance: {
    platform: string
    posts: number
    reach: number
    impressions: number
    engagement: number
    clicks: number
    engagementRate: number
  }[]
  engagement: {
    mentions: number
    comments: number
    dms: number
    whatsapp: number
    email: number
  }
  calendar: {
    id: string
    kind: 'scheduled_post' | 'marketing_post' | 'campaign' | 'launch'
    title: string
    channel: string
    at: string
    status: string
  }[]
  bestTimeToPost: {
    dayOfWeek: number
    dayLabel: string
    hour: number
    hourLabel: string
    posts: number
    avgEngagement: number
  }[]
  audienceSegments: {
    id: string
    name: string
    criteria: string
  }[]
  unifiedInbox: {
    id: string
    source: 'social' | 'whatsapp' | 'email'
    channel: string
    action: string
    actorName: string | null
    preview: string | null
    at: string
    requiresResponse: boolean
    replyHref: string
  }[]
}
