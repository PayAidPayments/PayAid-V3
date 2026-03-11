import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { transcribeAudioFree } from '@/lib/voice-agent/stt-free'
import { synthesizeSpeechFree } from '@/lib/voice-agent/tts-free'
import { detectHindiOrHinglish, getLanguageCode, getTTSVoiceId } from '@/lib/voice-agent/hindi-support'

/**
 * POST /api/ai/voice/process
 * Process voice input (STT) or generate voice output (TTS)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const contentType = request.headers.get('content-type') || ''

    // Handle audio file upload (STT)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const audioFile = formData.get('audio') as File | null
      const autoDetect = formData.get('autoDetect') === 'true'

      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        )
      }

      // Convert File to Buffer
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = Buffer.from(arrayBuffer)

      // Transcribe audio
      let language: string | undefined = undefined
      if (autoDetect) {
        // First, try to detect language from a sample transcription
        try {
          const sampleResult = await transcribeAudioFree(audioBuffer, undefined)
          if (sampleResult.text) {
            const detection = detectHindiOrHinglish(sampleResult.text)
            language = getLanguageCode(detection)
          }
        } catch {
          // If detection fails, proceed with auto-detect
          language = undefined
        }
      }

      const sttResult = await transcribeAudioFree(audioBuffer, language)

      // Detect Hindi/Hinglish from transcript if auto-detect
      let finalLanguage = sttResult.language || 'en'
      if (autoDetect && sttResult.text) {
        const detection = detectHindiOrHinglish(sttResult.text)
        finalLanguage = getLanguageCode(detection)
      }

      return NextResponse.json({
        transcript: sttResult.text,
        language: finalLanguage,
        confidence: sttResult.confidence,
        service: sttResult.service || 'whisper',
        segments: sttResult.segments
      })
    }

    // Handle JSON request (TTS)
    const body = await request.json()
    const { action, text, language = 'en', voiceId, speed = 1.0 } = body

    if (action !== 'synthesize') {
      return NextResponse.json(
        { error: 'Invalid action. Use "synthesize" for TTS' },
        { status: 400 }
      )
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required for synthesis' },
        { status: 400 }
      )
    }

    // Detect language if not provided
    let finalLanguage = language
    if (language === 'auto' || !language) {
      const detection = detectHindiOrHinglish(text)
      finalLanguage = getLanguageCode(detection)
    }

    // Get voice ID based on language if not provided
    const finalVoiceId = voiceId || getTTSVoiceId(finalLanguage)

    // Synthesize speech
    const audioBuffer = await synthesizeSpeechFree(
      text,
      finalLanguage,
      finalVoiceId,
      speed
    )

    // Convert buffer to base64 data URL for frontend
    const audioBase64 = audioBuffer.toString('base64')
    const audioUrl = `data:audio/wav;base64,${audioBase64}`

    return NextResponse.json({
      audioUrl,
      language: finalLanguage,
      voiceId: finalVoiceId,
      text
    })
  } catch (error) {
    console.error('[Voice Process API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process voice',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
