/**
 * Transcript Processor - Auto-Documentation
 * Extracts action items, key points, and summaries from meeting transcripts
 * FREE implementation using Ollama/Groq
 */

import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { prisma } from '@/lib/db/prisma'

export interface ActionItem {
  task: string
  assignee?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  context?: string
}

export interface TranscriptAnalysis {
  actionItems: ActionItem[]
  keyPoints: string[]
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
}

/**
 * Extract action items from transcript using AI
 */
export async function extractActionItems(transcript: string): Promise<ActionItem[]> {
  const prompt = `Analyze the following meeting transcript and extract all action items. 
Return ONLY a JSON array of action items in this exact format:
[
  {
    "task": "Specific action item description",
    "assignee": "Person responsible (if mentioned)",
    "dueDate": "YYYY-MM-DD or relative date like 'next week'",
    "priority": "low|medium|high",
    "context": "Brief context about why this action is needed"
  }
]

Transcript:
${transcript}

Rules:
- Extract only concrete, actionable items (not general discussion)
- If no assignee is mentioned, leave it empty
- Set priority based on urgency and importance mentioned
- Return empty array [] if no action items found
- Return ONLY valid JSON, no other text`

  const systemPrompt = `You are a meeting transcript analyzer. Extract action items in JSON format only.`

  let response = ''
  try {
    // Try Groq first
    try {
      const groq = getGroqClient()
      const groqResponse = await groq.generateCompletion(prompt, systemPrompt)
      response = groqResponse
    } catch (groqError) {
      // Fallback to Ollama
      try {
        const ollama = getOllamaClient()
        response = await ollama.generateCompletion(prompt, systemPrompt)
      } catch (ollamaError) {
        // Fallback to HuggingFace
        const huggingFace = getHuggingFaceClient()
        response = await huggingFace.generateCompletion(prompt, systemPrompt)
      }
    }

    // Parse JSON response
    // Clean response (remove markdown code blocks if present)
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const actionItems = JSON.parse(cleanedResponse) as ActionItem[]
    return Array.isArray(actionItems) ? actionItems : []
  } catch (error) {
    console.error('[TRANSCRIPT_PROCESSOR] Error extracting action items:', error)
    // Fallback: Simple pattern matching
    return extractActionItemsFallback(transcript)
  }
}

/**
 * Fallback: Simple pattern matching for action items
 */
function extractActionItemsFallback(transcript: string): ActionItem[] {
  const actionItems: ActionItem[] = []
  const lines = transcript.split('\n')

  const actionPatterns = [
    /(?:need to|must|should|will|going to)\s+([^.!?]+[.!?])/gi,
    /(?:action|task|todo|follow up|follow-up):\s*([^.!?]+[.!?])/gi,
    /(?:assign|delegate|give)\s+([^.!?]+[.!?])/gi,
  ]

  for (const line of lines) {
    for (const pattern of actionPatterns) {
      const matches = line.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          actionItems.push({
            task: match[1].trim(),
            priority: line.toLowerCase().includes('urgent') || line.toLowerCase().includes('critical') ? 'high' : 'medium',
          })
        }
      }
    }
  }

  return actionItems.slice(0, 10) // Limit to 10 items
}

/**
 * Extract key points from transcript
 */
export async function extractKeyPoints(transcript: string): Promise<string[]> {
  const prompt = `Analyze the following meeting transcript and extract the 5-7 most important key points.
Return ONLY a JSON array of strings:
["Key point 1", "Key point 2", ...]

Transcript:
${transcript}`

  const systemPrompt = `You are a meeting transcript analyzer. Extract key points in JSON array format only.`

  try {
    let response = ''
    try {
      const groq = getGroqClient()
      response = await groq.generateCompletion(prompt, systemPrompt)
    } catch {
      const ollama = getOllamaClient()
      response = await ollama.generateCompletion(prompt, systemPrompt)
    }

    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const keyPoints = JSON.parse(cleanedResponse) as string[]
    return Array.isArray(keyPoints) ? keyPoints : []
  } catch (error) {
    console.error('[TRANSCRIPT_PROCESSOR] Error extracting key points:', error)
    return []
  }
}

/**
 * Generate meeting summary
 */
export async function generateSummary(transcript: string): Promise<string> {
  const prompt = `Summarize the following meeting transcript in 3-4 paragraphs.
Focus on:
- Main topics discussed
- Decisions made
- Important outcomes
- Next steps

Transcript:
${transcript}`

  const systemPrompt = `You are a meeting transcript analyzer. Generate a concise summary.`

  try {
    let response = ''
    try {
      const groq = getGroqClient()
      response = await groq.generateCompletion(prompt, systemPrompt)
    } catch {
      const ollama = getOllamaClient()
      response = await ollama.generateCompletion(prompt, systemPrompt)
    }

    return response.trim()
  } catch (error) {
    console.error('[TRANSCRIPT_PROCESSOR] Error generating summary:', error)
    return 'Summary generation failed. Please review the transcript manually.'
  }
}

/**
 * Analyze sentiment of transcript
 */
export async function analyzeSentiment(transcript: string): Promise<{ sentiment: 'positive' | 'neutral' | 'negative'; score: number }> {
  const prompt = `Analyze the sentiment of this meeting transcript.
Return ONLY a JSON object:
{"sentiment": "positive|neutral|negative", "score": 0.0-1.0}

Transcript:
${transcript.substring(0, 1000)}` // Limit length

  const systemPrompt = `You are a sentiment analyzer. Return JSON only.`

  try {
    let response = ''
    try {
      const groq = getGroqClient()
      response = await groq.generateCompletion(prompt, systemPrompt)
    } catch {
      const ollama = getOllamaClient()
      response = await ollama.generateCompletion(prompt, systemPrompt)
    }

    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleanedResponse) as { sentiment: string; score: number }
    
    return {
      sentiment: (result.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
      score: result.score || 0.5,
    }
  } catch (error) {
    console.error('[TRANSCRIPT_PROCESSOR] Error analyzing sentiment:', error)
    return { sentiment: 'neutral', score: 0.5 }
  }
}

/**
 * Process transcript and extract all information
 */
export async function processTranscript(
  callId: string,
  tenantId: string
): Promise<TranscriptAnalysis> {
  // Get transcript from database
  const transcriptRecord = await prisma.callTranscript.findFirst({
    where: {
      callId,
      tenantId,
    },
  })

  if (!transcriptRecord) {
    throw new Error('Transcript not found')
  }

  const transcript = transcriptRecord.transcript

  // Extract all information in parallel
  const [actionItems, keyPoints, summary, sentiment] = await Promise.all([
    extractActionItems(transcript),
    extractKeyPoints(transcript),
    generateSummary(transcript),
    analyzeSentiment(transcript),
  ])

  // Update transcript record with extracted data
  await prisma.callTranscript.update({
    where: { id: transcriptRecord.id },
    data: {
      actionItems: actionItems as any,
      keyPoints: keyPoints as any,
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.score,
    },
  })

  // Create tasks from action items
  for (const actionItem of actionItems) {
    try {
      await prisma.task.create({
        data: {
          tenantId,
          title: actionItem.task,
          description: actionItem.context || `Auto-generated from meeting transcript`,
          priority: actionItem.priority,
          dueDate: actionItem.dueDate ? new Date(actionItem.dueDate) : undefined,
          status: 'pending',
        },
      })
    } catch (error) {
      console.error('[TRANSCRIPT_PROCESSOR] Error creating task:', error)
      // Continue with other tasks
    }
  }

  return {
    actionItems,
    keyPoints,
    summary,
    sentiment: sentiment.sentiment,
    sentimentScore: sentiment.score,
  }
}
