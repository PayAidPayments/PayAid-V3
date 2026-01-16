/**
 * TTS Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { synthesizeSpeech, getAvailableVoices } from '@/lib/voice-agent/tts'

jest.mock('@/lib/ai/gateway', () => ({
  aiGateway: {
    textToSpeech: jest.fn(),
  },
}))

jest.mock('@/lib/voice-agent/bhashini-tts', () => ({
  synthesizeWithBhashini: jest.fn(),
  isBhashiniConfigured: jest.fn(),
  isLanguageSupported: jest.fn(),
  getAvailableVoices: jest.fn(),
}))

jest.mock('@/lib/voice-agent/indicparler-tts', () => ({
  synthesizeWithIndicParler: jest.fn(),
  isIndicParlerAvailable: jest.fn(),
  isLanguageSupported: jest.fn(),
}))

describe('TTS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('synthesizeSpeech', () => {
    it('should use Coqui for English', async () => {
      const { aiGateway } = require('@/lib/ai/gateway')

      aiGateway.textToSpeech.mockResolvedValue({
        audio_url: 'http://audio.url',
      })

      // Mock fetch for audio download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      })

      const result = await synthesizeSpeech('Hello', 'en')

      expect(result).toBeInstanceOf(Buffer)
      expect(aiGateway.textToSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello',
          language: 'en',
        })
      )
    })

    it('should use Coqui for Hindi', async () => {
      const { aiGateway } = require('@/lib/ai/gateway')

      aiGateway.textToSpeech.mockResolvedValue({
        audio_url: 'http://audio.url',
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      })

      await synthesizeSpeech('नमस्ते', 'hi')

      expect(aiGateway.textToSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'hi',
        })
      )
    })

    it('should use Bhashini for regional languages if configured', async () => {
      const { synthesizeWithBhashini, isBhashiniConfigured, isLanguageSupported } = require('@/lib/voice-agent/bhashini-tts')

      isBhashiniConfigured.mockReturnValue(true)
      isLanguageSupported.mockReturnValue(true)
      synthesizeWithBhashini.mockResolvedValue({
        audioData: Buffer.from('audio'),
        audioUrl: 'http://audio.url',
      })

      const result = await synthesizeSpeech('வணக்கம்', 'ta')

      expect(synthesizeWithBhashini).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('getAvailableVoices', () => {
    it('should return voices for a language', () => {
      const voices = getAvailableVoices('en')
      expect(Array.isArray(voices)).toBe(true)
      expect(voices.length).toBeGreaterThan(0)
    })

    it('should return default voices for unknown language', () => {
      const voices = getAvailableVoices('unknown')
      expect(Array.isArray(voices)).toBe(true)
    })
  })
})

