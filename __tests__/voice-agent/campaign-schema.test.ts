import {
  DEFAULT_BUSINESS_HOURS,
  isWithinBusinessHours,
  parseBusinessHours,
  parseHm,
} from '@/lib/voice-agent/campaign-schema'

describe('campaign business hours', () => {
  it('parseHm converts HH:mm to minutes', () => {
    expect(parseHm('09:30')).toBe(570)
    expect(parseHm('20:00')).toBe(1200)
  })

  it('null config allows dialing anytime', () => {
    expect(isWithinBusinessHours(null)).toBe(true)
    expect(isWithinBusinessHours(undefined)).toBe(true)
  })

  it('parses valid business hours JSON', () => {
    const parsed = parseBusinessHours(DEFAULT_BUSINESS_HOURS)
    expect(parsed?.timezone).toBe('Asia/Kolkata')
    expect(parsed?.days).toContain(1)
  })

  it('rejects invalid business hours JSON', () => {
    expect(parseBusinessHours({ timezone: '', days: [], start: 'bad', end: '20:00' })).toBeNull()
  })

  it('evaluates weekday membership in timezone', () => {
    const monday10am = new Date('2026-06-01T04:30:00.000Z') // Mon 10:00 IST
    const config = {
      timezone: 'Asia/Kolkata',
      days: [1],
      start: '09:00',
      end: '18:00',
    }
    expect(isWithinBusinessHours(config, monday10am)).toBe(true)

    const sunday10am = new Date('2026-05-31T04:30:00.000Z') // Sun 10:00 IST
    expect(isWithinBusinessHours(config, sunday10am)).toBe(false)
  })
})
