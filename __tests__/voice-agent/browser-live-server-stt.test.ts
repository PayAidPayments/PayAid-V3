jest.mock('@/lib/voice-agent/sarvam', () => ({
  isSarvamConfigured: jest.fn(() => false),
  sarvamStt: jest.fn(async () => ({ text: 'sarvam transcript', language: 'hi', service: 'sarvam-stt' })),
}))

jest.mock('@/lib/voice-agent/stt-free', () => ({
  transcribeAudioFree: jest.fn(async () => ({ text: 'whisper transcript', language: 'en', service: 'whisper-free' })),
}))

import { isSarvamConfigured, sarvamStt } from '@/lib/voice-agent/sarvam'
import { transcribeAudioFree } from '@/lib/voice-agent/stt-free'
import { browserLiveSttProvider, transcribeBrowserLiveAudio } from '@/lib/voice-agent/browser-live/server-stt'

const sampleB64 = Buffer.from('fake-audio').toString('base64')
const mockedIsSarvamConfigured = isSarvamConfigured as jest.MockedFunction<typeof isSarvamConfigured>
const mockedSarvamStt = sarvamStt as jest.MockedFunction<typeof sarvamStt>
const mockedTranscribeAudioFree = transcribeAudioFree as jest.MockedFunction<typeof transcribeAudioFree>

describe('browserLiveSttProvider', () => {
  const prev = process.env.BROWSER_LIVE_STT_PROVIDER

  afterEach(() => {
    if (prev === undefined) delete process.env.BROWSER_LIVE_STT_PROVIDER
    else process.env.BROWSER_LIVE_STT_PROVIDER = prev
  })

  it('defaults to auto', () => {
    delete process.env.BROWSER_LIVE_STT_PROVIDER
    expect(browserLiveSttProvider()).toBe('auto')
  })

  it('maps gateway alias to whisper', () => {
    process.env.BROWSER_LIVE_STT_PROVIDER = 'gateway'
    expect(browserLiveSttProvider()).toBe('whisper')
  })
})

describe('transcribeBrowserLiveAudio', () => {
  const prev = process.env.BROWSER_LIVE_STT_PROVIDER

  beforeEach(() => {
    mockedIsSarvamConfigured.mockReturnValue(false)
    mockedSarvamStt.mockClear()
    mockedTranscribeAudioFree.mockClear()
  })

  afterEach(() => {
    if (prev === undefined) delete process.env.BROWSER_LIVE_STT_PROVIDER
    else process.env.BROWSER_LIVE_STT_PROVIDER = prev
  })

  it('uses Whisper when Sarvam is not configured', async () => {
    delete process.env.BROWSER_LIVE_STT_PROVIDER
    const result = await transcribeBrowserLiveAudio(sampleB64, 'audio/webm', 'en')
    expect(result.text).toBe('whisper transcript')
    expect(mockedSarvamStt).not.toHaveBeenCalled()
    expect(mockedTranscribeAudioFree).toHaveBeenCalled()
  })

  it('prefers Sarvam in auto mode when configured', async () => {
    delete process.env.BROWSER_LIVE_STT_PROVIDER
    mockedIsSarvamConfigured.mockReturnValue(true)
    const result = await transcribeBrowserLiveAudio(sampleB64, 'audio/webm', 'hi')
    expect(result.text).toBe('sarvam transcript')
    expect(mockedSarvamStt).toHaveBeenCalled()
    expect(mockedTranscribeAudioFree).not.toHaveBeenCalled()
  })

  it('falls back to Whisper when Sarvam fails in auto mode', async () => {
    delete process.env.BROWSER_LIVE_STT_PROVIDER
    mockedIsSarvamConfigured.mockReturnValue(true)
    mockedSarvamStt.mockRejectedValueOnce(new Error('Sarvam STT failed (503)'))
    const result = await transcribeBrowserLiveAudio(sampleB64, 'audio/webm')
    expect(result.text).toBe('whisper transcript')
    expect(mockedTranscribeAudioFree).toHaveBeenCalled()
  })

  it('throws when Sarvam is forced and fails', async () => {
    process.env.BROWSER_LIVE_STT_PROVIDER = 'sarvam'
    mockedSarvamStt.mockRejectedValueOnce(new Error('quota exceeded'))
    await expect(transcribeBrowserLiveAudio(sampleB64, 'audio/webm')).rejects.toThrow('quota exceeded')
    expect(mockedTranscribeAudioFree).not.toHaveBeenCalled()
  })
})
