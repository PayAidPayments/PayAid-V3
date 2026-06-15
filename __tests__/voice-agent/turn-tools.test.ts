import { assessBrowserLiveToolCall } from '@/lib/voice-agent/browser-live/tool-safety'

describe('browser-live tool safety in turn path', () => {
  it('drafts payment link without confirmation', () => {
    const r = assessBrowserLiveToolCall({
      name: 'send_payment_link',
      args: { amount: 500 },
    })
    expect(r.action).toBe('draft')
  })
})
