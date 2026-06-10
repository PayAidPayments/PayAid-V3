import {
  formatVoiceEventLog,
  mapBrowserLiveToVoiceEvent,
} from '@/lib/voice-agent/events/voice-event-taxonomy'

describe('voice event taxonomy', () => {
  it('maps browser-live wire events to blueprint names', () => {
    const started = mapBrowserLiveToVoiceEvent('session.ready', {
      tenantId: 't1',
      agentId: 'a1',
      sessionId: 's1',
    })
    expect(started?.event).toBe('call.started')

    const barge = mapBrowserLiveToVoiceEvent('interrupt.ack', {
      tenantId: 't1',
      sessionId: 's1',
      meta: { bargeInCount: 2 },
    })
    expect(barge?.event).toBe('barge_in.detected')

    const ended = mapBrowserLiveToVoiceEvent('session.ended', {
      tenantId: 't1',
      sessionId: 's1',
    })
    expect(ended?.event).toBe('call.completed')
  })

  it('formats structured log lines', () => {
    const line = formatVoiceEventLog({
      event: 'summary.ready',
      payload: {
        tenantId: 't1',
        sessionId: 's1',
        at: '2026-06-05T00:00:00.000Z',
        meta: { disposition: 'spoken_demo_new_lead' },
      },
    })
    const parsed = JSON.parse(line)
    expect(parsed.voiceEvent).toBe('summary.ready')
    expect(parsed.tenantId).toBe('t1')
  })
})
