import { resolveOutboundDialMode } from '@/lib/voice-agent/outbound-dial'
import { assessBrowserLiveToolCall } from '@/lib/voice-agent/browser-live/tool-safety'

describe('resolveOutboundDialMode', () => {
  const orig = { ...process.env }

  afterEach(() => {
    process.env = { ...orig }
  })

  it('returns stub when Twilio env is missing', () => {
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.VOICE_OUTBOUND_TWIML_URL
    expect(resolveOutboundDialMode()).toBe('stub')
  })
})

describe('assessBrowserLiveToolCall', () => {
  it('requires confirmation for payment tools', () => {
    const draft = assessBrowserLiveToolCall({
      name: 'send_payment_link',
      args: { amount: 100 },
    })
    expect(draft.action).toBe('draft')
  })

  it('executes when confirmed', () => {
    const ok = assessBrowserLiveToolCall({
      name: 'send_payment_link',
      args: { amount: 100, confirmed: true },
    })
    expect(ok.action).toBe('execute')
  })

  it('allows benign tools without confirmation', () => {
    const ok = assessBrowserLiveToolCall({
      name: 'schedule_callback',
      args: { phone: '9876543210' },
    })
    expect(ok.action).toBe('execute')
  })
})
