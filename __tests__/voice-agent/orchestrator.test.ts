/**
 * Voice Agent Orchestrator Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { initiateVoiceAgentCall, processVoiceAgentTurn, endVoiceAgentCall } from '@/lib/voice-agent/orchestrator'

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    voiceAgent: {
      findUnique: jest.fn(),
    },
    voiceAgentCall: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    voiceAgentCallTranscript: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/voice-agent/stt', () => ({
  transcribeSpeech: jest.fn(),
}))

jest.mock('@/lib/voice-agent/llm', () => ({
  generateVoiceResponse: jest.fn(),
}))

jest.mock('@/lib/voice-agent/tts', () => ({
  synthesizeSpeech: jest.fn(),
}))

jest.mock('@/lib/voice-agent/knowledge-base', () => ({
  queryKnowledgeBase: jest.fn(),
}))

describe('Voice Agent Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initiateVoiceAgentCall', () => {
    it('should create a call record', async () => {
      const { prisma } = require('@/lib/db/prisma')
      const { transcribeSpeech } = require('@/lib/voice-agent/stt')

      prisma.voiceAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        tenantId: 'tenant-1',
        language: 'en',
        systemPrompt: 'Test prompt',
        complianceConfig: { check_dnd: false },
      })

      prisma.voiceAgentCall.create.mockResolvedValue({
        id: 'call-1',
        status: 'queued',
      })

      const result = await initiateVoiceAgentCall(
        'agent-1',
        { phoneNumber: '+919876543210', name: 'Test User' },
        'tenant-1'
      )

      expect(result).toBeDefined()
      expect(result.id).toBe('call-1')
      expect(prisma.voiceAgentCall.create).toHaveBeenCalled()
    })

    it('should check DND if configured', async () => {
      const { prisma } = require('@/lib/db/prisma')

      prisma.voiceAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        tenantId: 'tenant-1',
        language: 'en',
        systemPrompt: 'Test prompt',
        complianceConfig: { check_dnd: true },
      })

      // Mock DND check to block
      const { checkDNDStatus } = require('@/lib/voice-agent/dnd-checker')
      jest.spyOn(require('@/lib/voice-agent/dnd-checker'), 'checkDNDStatus').mockResolvedValue({
        isDND: true,
        status: 'blocked',
      })

      await expect(
        initiateVoiceAgentCall(
          'agent-1',
          { phoneNumber: '+9198765432100000' }, // DND number
          'tenant-1'
        )
      ).rejects.toThrow('blocked due to DND')
    })
  })

  describe('processVoiceAgentTurn', () => {
    it('should process a voice turn', async () => {
      const { prisma } = require('@/lib/db/prisma')
      const { transcribeSpeech } = require('@/lib/voice-agent/stt')
      const { generateVoiceResponse } = require('@/lib/voice-agent/llm')
      const { synthesizeSpeech } = require('@/lib/voice-agent/tts')

      prisma.voiceAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        tenantId: 'tenant-1',
        language: 'en',
        systemPrompt: 'Test prompt',
        knowledgeBaseIds: [],
      })

      transcribeSpeech.mockResolvedValue({
        text: 'Hello',
        language: 'en',
      })

      generateVoiceResponse.mockResolvedValue({
        message: 'Hi, how can I help you?',
      })

      synthesizeSpeech.mockResolvedValue(Buffer.from('audio data'))

      const context = {
        tenantId: 'tenant-1',
        voiceAgentId: 'agent-1',
        callId: 'call-1',
        conversationHistory: [],
        customerInfo: { phoneNumber: '+919876543210' },
      }

      const result = await processVoiceAgentTurn(context, 'http://audio.url', undefined)

      expect(result.agentResponseText).toBe('Hi, how can I help you?')
      expect(result.agentAudioUrl).toBeDefined()
    })
  })

  describe('endVoiceAgentCall', () => {
    it('should end a call and update status', async () => {
      const { prisma } = require('@/lib/db/prisma')

      prisma.voiceAgentCall.update.mockResolvedValue({
        id: 'call-1',
        status: 'completed',
        durationSeconds: 120,
        costRupees: 5.0,
      })

      const result = await endVoiceAgentCall('call-1', 'tenant-1', 'completed', 120, 5.0)

      expect(result.status).toBe('completed')
      expect(result.durationSeconds).toBe(120)
      expect(prisma.voiceAgentCall.update).toHaveBeenCalled()
    })
  })
})

