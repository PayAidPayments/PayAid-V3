/**
 * PayAid Social – shared types for Marketing Studio and standalone app.
 * Self-hosted only: PayAid Payments, Drive, AI stack, WAHA.
 */

export const MARKETING_CHANNELS = [
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'FACEBOOK',
  'INSTAGRAM',
  'TWITTER',
  'LINKEDIN',
  'YOUTUBE',
] as const

export type MarketingChannel = (typeof MARKETING_CHANNELS)[number]

export const MARKETING_GOALS = ['AWARENESS', 'TRAFFIC', 'LEADS', 'SALES'] as const
export type MarketingGoal = (typeof MARKETING_GOALS)[number]

export const POST_STATUS = ['DRAFT', 'SCHEDULED', 'SENT', 'FAILED'] as const
export type PostStatus = (typeof POST_STATUS)[number]

export interface SegmentSummary {
  id: string
  name: string
  contactCount?: number
  description?: string
}

export interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  fileName?: string
  width?: number
  height?: number
  tags?: string[]
}

export interface ChannelVariant {
  channel: MarketingChannel
  content: string
  mediaIds: string[]
}

export interface MarketingPostPayload {
  tenantId: string
  campaignId?: string
  channel: MarketingChannel
  content: string
  mediaIds: string[]
  scheduledFor: string | null
  status: PostStatus
  metadata?: Record<string, unknown>
}

export interface StudioStep1State {
  selectedSegmentId: string | null
  segmentSummary: SegmentSummary | null
  goal: MarketingGoal
}

export interface StudioStep2State {
  prompt: string
  generatedContent: string | null
  channelVariants: ChannelVariant[]
  generatedImages: MediaItem[]
  generatedVideo: MediaItem | null
  selectedImageIds: string[]
  brandTone?: string
  saveToLibrary: boolean
}

export interface StudioStep3State {
  selectedChannels: MarketingChannel[]
  contentByChannel: Record<MarketingChannel, string>
  mediaIdsByChannel: Record<MarketingChannel, string[]>
  sendNow: boolean
  scheduledFor: string | null
}

export interface StudioState {
  step: 1 | 2 | 3 | 4
  step1: StudioStep1State
  step2: StudioStep2State
  step3: StudioStep3State
  isLaunching: boolean
  lastLaunchedAt: string | null
}
