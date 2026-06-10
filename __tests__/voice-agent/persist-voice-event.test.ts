import { persistVoiceEventToDemoSession } from '@/lib/voice-agent/events/persist-voice-event'
import type { VoiceEvent } from '@/lib/voice-agent/events/voice-event-taxonomy'

describe('persistVoiceEventToDemoSession', () => {
  it('appends event to metadataJson.voiceEvents', async () => {
    const metadataJson = { source: 'test' }
    const update = jest.fn()
    const findUnique = jest.fn().mockResolvedValue({ metadataJson })

    const prisma = {
      voiceDemoSession: { findUnique, update },
    } as unknown as import('@prisma/client').PrismaClient

    const evt: VoiceEvent = {
      event: 'call.started',
      payload: {
        tenantId: 'tenant_1',
        agentId: 'agent_1',
        sessionId: 'sess_1',
        at: '2026-06-06T00:00:00.000Z',
        meta: { channel: 'browser_live' },
      },
    }

    await persistVoiceEventToDemoSession(prisma, 'sess_1', evt)

    expect(update).toHaveBeenCalledWith({
      where: { id: 'sess_1' },
      data: {
        metadataJson: expect.objectContaining({
          source: 'test',
          voiceEvents: [
            expect.objectContaining({
              event: 'call.started',
              tenantId: 'tenant_1',
            }),
          ],
          lastVoiceEventAt: '2026-06-06T00:00:00.000Z',
        }),
      },
    })
  })
})
