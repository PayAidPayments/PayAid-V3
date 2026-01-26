import { prisma } from '@/lib/db/prisma'
import { Groq } from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface TranscriptionResult {
  transcript: string
  segments: Array<{
    speaker: string | null
    text: string
    startTime: number
    endTime: number
    confidence: number
  }>
  summary: string
  duration: number
  language: string
}

/**
 * Transcribe audio file using Whisper (via Groq or direct API)
 */
export async function transcribeAudio(
  audioUrl: string,
  options?: {
    language?: string
    speakerDiarization?: boolean
    tenantId: string
  }
): Promise<TranscriptionResult> {
  try {
    // Option 1: Use Groq's Whisper API (if available)
    if (process.env.GROQ_API_KEY) {
      const transcription = await transcribeWithGroq(audioUrl, options)
      return transcription
    }

    // Option 2: Use OpenAI Whisper API (fallback)
    if (process.env.OPENAI_API_KEY) {
      const transcription = await transcribeWithOpenAI(audioUrl, options)
      return transcription
    }

    // Option 3: Use local Whisper service (if available)
    if (process.env.WHISPER_API_URL) {
      const transcription = await transcribeWithLocalWhisper(audioUrl, options)
      return transcription
    }

    throw new Error('No transcription service available. Please configure GROQ_API_KEY, OPENAI_API_KEY, or WHISPER_API_URL')
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

/**
 * Transcribe using Groq's Whisper API
 */
async function transcribeWithGroq(
  audioUrl: string,
  options?: { language?: string; speakerDiarization?: boolean; tenantId: string }
): Promise<TranscriptionResult> {
  // Download audio file
  const audioBuffer = await fetch(audioUrl).then((res) => res.arrayBuffer())

  // Use Groq's file API (if available) or fallback to OpenAI format
  const formData = new FormData()
  const blob = new Blob([audioBuffer])
  formData.append('file', blob, 'audio.mp3')
  formData.append('model', 'whisper-large-v3')
  if (options?.language) {
    formData.append('language', options.language)
  }

  // Note: Groq may not have direct Whisper API, so we'll use OpenAI format
  // In production, you might use a different service or direct Whisper API
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`)
  }

  const data = await response.json()
  
  return {
    transcript: data.text,
    segments: [], // Groq/OpenAI basic transcription doesn't provide segments
    summary: '', // Will be generated separately
    duration: 0, // Will be calculated from audio file
    language: data.language || options?.language || 'en',
  }
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(
  audioUrl: string,
  options?: { language?: string; speakerDiarization?: boolean; tenantId: string }
): Promise<TranscriptionResult> {
  const audioBuffer = await fetch(audioUrl).then((res) => res.arrayBuffer())
  
  const formData = new FormData()
  const blob = new Blob([audioBuffer])
  formData.append('file', blob, 'audio.mp3')
  formData.append('model', 'whisper-1')
  if (options?.language) {
    formData.append('language', options.language)
  }
  if (options?.speakerDiarization) {
    formData.append('response_format', 'verbose_json')
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`)
  }

  const data = await response.json()
  
  return {
    transcript: data.text,
    segments: data.segments || [],
    summary: '', // Will be generated separately
    duration: data.duration || 0,
    language: data.language || options?.language || 'en',
  }
}

/**
 * Transcribe using local Whisper service
 */
async function transcribeWithLocalWhisper(
  audioUrl: string,
  options?: { language?: string; speakerDiarization?: boolean; tenantId: string }
): Promise<TranscriptionResult> {
  const response = await fetch(`${process.env.WHISPER_API_URL}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language: options?.language || 'en',
      speaker_diarization: options?.speakerDiarization || false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`)
  }

  const data = await response.json()
  
  return {
    transcript: data.text,
    segments: data.segments || [],
    summary: data.summary || '',
    duration: data.duration || 0,
    language: data.language || 'en',
  }
}

/**
 * Generate summary of transcription
 */
export async function generateTranscriptionSummary(
  transcript: string,
  tenantId: string
): Promise<string> {
  try {
    const prompt = `Summarize this call transcript in 3 lines. Focus on:
1. Main topic discussed
2. Key decisions or outcomes
3. Next steps or action items

Transcript:
${transcript}

Summary:`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      max_tokens: 200,
    })

    return completion.choices[0]?.message?.content || 'No summary available'
  } catch (error) {
    console.error('Summary generation error:', error)
    // Fallback to simple summary
    const lines = transcript.split('\n').filter((line) => line.trim().length > 0)
    return `Call transcript with ${lines.length} segments. Main topics discussed.`
  }
}

/**
 * Extract action items from transcription
 */
export async function extractActionItems(
  transcript: string,
  tenantId: string
): Promise<Array<{ text: string; assignee?: string; dueDate?: Date }>> {
  try {
    const prompt = `Extract action items from this call transcript. Return as JSON array with format:
[
  {"text": "Action item description", "assignee": "Name or null", "dueDate": "YYYY-MM-DD or null"}
]

Transcript:
${transcript}

Action Items (JSON only):`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.2,
      max_tokens: 500,
    })

    const content = completion.choices[0]?.message?.content || '[]'
    const actionItems = JSON.parse(content) as Array<{
      text: string
      assignee?: string
      dueDate?: string
    }>

    return actionItems.map((item) => ({
      text: item.text,
      assignee: item.assignee || undefined,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
    }))
  } catch (error) {
    console.error('Action items extraction error:', error)
    return []
  }
}

/**
 * Save transcription to database and attach to interaction
 */
export async function saveTranscription(
  interactionId: string,
  transcription: TranscriptionResult,
  audioUrl: string,
  tenantId: string
): Promise<void> {
  await prisma.interaction.update({
    where: { id: interactionId, tenantId },
    data: {
      notes: transcription.transcript,
      metadata: {
        ...((prisma.interaction.findUnique({ where: { id: interactionId } }) as any)?.metadata || {}),
        transcription: {
          transcript: transcription.transcript,
          segments: transcription.segments,
          summary: transcription.summary,
          duration: transcription.duration,
          language: transcription.language,
          audioUrl,
          transcribedAt: new Date().toISOString(),
        },
      },
    },
  })
}

/**
 * Search transcripts
 */
export async function searchTranscripts(
  query: string,
  tenantId: string,
  options?: {
    contactId?: string
    dealId?: string
    dateFrom?: Date
    dateTo?: Date
    limit?: number
  }
): Promise<Array<{
  interactionId: string
  contactId: string | null
  dealId: string | null
  transcript: string
  summary: string
  createdAt: Date
}>> {
  const interactions = await prisma.interaction.findMany({
    where: {
      tenantId,
      type: { in: ['call', 'meeting'] },
      ...(options?.contactId && { contactId: options.contactId }),
      ...(options?.dealId && { dealId: options.dealId }),
      ...(options?.dateFrom && { createdAt: { gte: options.dateFrom } }),
      ...(options?.dateTo && { createdAt: { lte: options.dateTo } }),
      notes: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      contactId: true,
      dealId: true,
      notes: true,
      metadata: true,
      createdAt: true,
    },
    take: options?.limit || 50,
    orderBy: { createdAt: 'desc' },
  })

  return interactions.map((interaction) => {
    const metadata = (interaction.metadata as any) || {}
    const transcription = metadata.transcription || {}

    return {
      interactionId: interaction.id,
      contactId: interaction.contactId,
      dealId: interaction.dealId,
      transcript: interaction.notes || transcription.transcript || '',
      summary: transcription.summary || '',
      createdAt: interaction.createdAt,
    }
  })
}
