/**
 * Voice campaign schema helpers — trigger_source + business_hours (Phase 3.2).
 */
import { z } from 'zod'

export const VOICE_CAMPAIGN_TRIGGER_SOURCES = [
  'manual',
  'website_lead',
  'crm_stage',
  'missed_call',
  'marketing_lead',
  'escalation_callback',
] as const

export type VoiceCampaignTriggerSource = (typeof VOICE_CAMPAIGN_TRIGGER_SOURCES)[number]

export type VoiceCampaignBusinessHours = {
  timezone: string
  /** 0=Sun .. 6=Sat */
  days: number[]
  /** HH:mm 24-hour */
  start: string
  end: string
}

export const businessHoursSchema = z.object({
  timezone: z.string().min(1).max(64),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

export const triggerSourceSchema = z.enum(VOICE_CAMPAIGN_TRIGGER_SOURCES)

export const DEFAULT_BUSINESS_HOURS: VoiceCampaignBusinessHours = {
  timezone: 'Asia/Kolkata',
  days: [1, 2, 3, 4, 5, 6],
  start: '09:00',
  end: '20:00',
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function parseHm(value: string): number {
  const [h, m] = value.split(':').map((x) => Number(x))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

export function parseBusinessHours(raw: unknown): VoiceCampaignBusinessHours | null {
  if (raw == null) return null
  const parsed = businessHoursSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

function getZonedWeekdayAndMinutes(date: Date, timeZone: string): { weekday: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  return {
    weekday: WEEKDAY_MAP[weekdayStr] ?? 0,
    minutes: hour * 60 + minute,
  }
}

/** null/undefined config → always allowed (backward compatible). */
export function isWithinBusinessHours(
  config: VoiceCampaignBusinessHours | null | undefined,
  at: Date = new Date(),
): boolean {
  if (!config) return true
  const { weekday, minutes } = getZonedWeekdayAndMinutes(at, config.timezone)
  if (!config.days.includes(weekday)) return false
  const startMin = parseHm(config.start)
  const endMin = parseHm(config.end)
  if (endMin <= startMin) return minutes >= startMin || minutes < endMin
  return minutes >= startMin && minutes < endMin
}

export function formatTriggerSourceLabel(source: string | null | undefined): string {
  if (!source || source === 'manual') return 'Manual'
  return source.replace(/_/g, ' ')
}
