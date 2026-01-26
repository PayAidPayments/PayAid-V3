import { prisma } from '@/lib/db/prisma'
import { Groq } from 'groq-sdk'
import { extractActionItems } from './transcription-service'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral'
  score: number // -1 to 1
  segments: Array<{
    text: string
    sentiment: 'positive' | 'negative' | 'neutral'
    score: number
    timestamp?: number
  }>
}

export interface MeetingSummary {
  summary: string // 3-line summary
  keyTopics: string[]
  decisions: string[]
  nextSteps: string[]
  participants: string[]
  duration: number
}

export interface CoachingInsight {
  type: 'talk_time' | 'objection_handling' | 'discovery' | 'closing' | 'engagement'
  severity: 'low' | 'medium' | 'high'
  message: string
  recommendation: string
  score?: number
}

/**
 * Analyze sentiment of meeting transcript
 */
export async function analyzeSentiment(
  transcript: string,
  tenantId: string
): Promise<SentimentAnalysis> {
  try {
    const prompt = `Analyze the sentiment of this meeting transcript. Return JSON with:
{
  "overall": "positive" | "negative" | "neutral",
  "score": -1 to 1,
  "segments": [
    {"text": "segment text", "sentiment": "positive" | "negative" | "neutral", "score": -1 to 1}
  ]
}

Transcript:
${transcript}

Analysis (JSON only):`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.2,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content) as SentimentAnalysis

    return analysis
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    // Fallback to neutral
    return {
      overall: 'neutral',
      score: 0,
      segments: [],
    }
  }
}

/**
 * Generate meeting summary (3-line summary)
 */
export async function generateMeetingSummary(
  transcript: string,
  tenantId: string
): Promise<MeetingSummary> {
  try {
    const prompt = `Generate a comprehensive meeting summary from this transcript. Return JSON with:
{
  "summary": "3-line summary of the meeting",
  "keyTopics": ["topic1", "topic2"],
  "decisions": ["decision1", "decision2"],
  "nextSteps": ["step1", "step2"],
  "participants": ["name1", "name2"],
  "duration": minutes
}

Transcript:
${transcript}

Summary (JSON only):`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const summary = JSON.parse(content) as MeetingSummary

    return summary
  } catch (error) {
    console.error('Meeting summary error:', error)
    // Fallback summary
    return {
      summary: 'Meeting transcript processed. Key topics and decisions discussed.',
      keyTopics: [],
      decisions: [],
      nextSteps: [],
      participants: [],
      duration: 0,
    }
  }
}

/**
 * Generate coaching insights from meeting
 */
export async function generateCoachingInsights(
  transcript: string,
  interactionId: string,
  tenantId: string
): Promise<CoachingInsight[]> {
  try {
    const insights: CoachingInsight[] = []

    // Analyze talk time ratio
    const talkTimeInsight = await analyzeTalkTime(transcript, tenantId)
    if (talkTimeInsight) {
      insights.push(talkTimeInsight)
    }

    // Analyze objection handling
    const objectionInsight = await analyzeObjectionHandling(transcript, tenantId)
    if (objectionInsight) {
      insights.push(objectionInsight)
    }

    // Analyze discovery questions
    const discoveryInsight = await analyzeDiscoveryQuestions(transcript, tenantId)
    if (discoveryInsight) {
      insights.push(discoveryInsight)
    }

    // Analyze engagement
    const engagementInsight = await analyzeEngagement(transcript, tenantId)
    if (engagementInsight) {
      insights.push(engagementInsight)
    }

    // Analyze closing attempts
    const closingInsight = await analyzeClosingAttempts(transcript, tenantId)
    if (closingInsight) {
      insights.push(closingInsight)
    }

    return insights
  } catch (error) {
    console.error('Coaching insights error:', error)
    return []
  }
}

/**
 * Analyze talk time ratio (sales rep vs customer)
 */
async function analyzeTalkTime(
  transcript: string,
  tenantId: string
): Promise<CoachingInsight | null> {
  try {
    const prompt = `Analyze the talk time ratio in this meeting transcript. Identify:
1. Sales rep talk time percentage
2. Customer talk time percentage
3. Ideal ratio is 50% rep, 50% customer

Transcript:
${transcript}

Analysis (JSON): {"repPercentage": number, "customerPercentage": number}`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.2,
      max_tokens: 200,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content) as { repPercentage: number; customerPercentage: number }

    const repPercentage = analysis.repPercentage || 50
    const idealRatio = 50

    let severity: 'low' | 'medium' | 'high' = 'low'
    if (repPercentage > 70) severity = 'high'
    else if (repPercentage > 60) severity = 'medium'

    if (repPercentage > 60) {
      return {
        type: 'talk_time',
        severity,
        message: `Sales rep talked ${repPercentage.toFixed(0)}% of the time (ideal: 50%)`,
        recommendation: 'Ask more open-ended questions and listen more. Let the customer speak.',
        score: repPercentage,
      }
    }

    return null
  } catch (error) {
    console.error('Talk time analysis error:', error)
    return null
  }
}

/**
 * Analyze objection handling
 */
async function analyzeObjectionHandling(
  transcript: string,
  tenantId: string
): Promise<CoachingInsight | null> {
  try {
    const prompt = `Identify customer objections in this meeting transcript and check if they were addressed. Return JSON:
{
  "objections": [{"type": "budget" | "timing" | "need" | "competitor", "addressed": boolean, "text": "objection text"}]
}

Transcript:
${transcript}

Analysis (JSON only):`

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

    const content = completion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content) as {
      objections: Array<{ type: string; addressed: boolean; text: string }>
    }

    const unaddressed = analysis.objections?.filter((o) => !o.addressed) || []

    if (unaddressed.length > 0) {
      const objectionTypes = unaddressed.map((o) => o.type).join(', ')
      return {
        type: 'objection_handling',
        severity: unaddressed.length > 1 ? 'high' : 'medium',
        message: `Customer objection not addressed: ${objectionTypes}`,
        recommendation: 'Address objections directly. Ask clarifying questions and provide solutions.',
      }
    }

    return null
  } catch (error) {
    console.error('Objection handling analysis error:', error)
    return null
  }
}

/**
 * Analyze discovery questions
 */
async function analyzeDiscoveryQuestions(
  transcript: string,
  tenantId: string
): Promise<CoachingInsight | null> {
  try {
    const prompt = `Count discovery questions asked in this meeting. Ideal: 5-7 questions. Return JSON:
{
  "questionCount": number,
  "questions": ["question1", "question2"]
}

Transcript:
${transcript}

Analysis (JSON only):`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.2,
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content) as { questionCount: number; questions: string[] }

    const questionCount = analysis.questionCount || 0

    if (questionCount < 5) {
      return {
        type: 'discovery',
        severity: questionCount < 3 ? 'high' : 'medium',
        message: `Only ${questionCount} discovery questions asked (ideal: 5-7)`,
        recommendation: 'Ask more discovery questions to understand customer needs better.',
        score: questionCount,
      }
    }

    return null
  } catch (error) {
    console.error('Discovery analysis error:', error)
    return null
  }
}

/**
 * Analyze customer engagement
 */
async function analyzeEngagement(
  transcript: string,
  tenantId: string
): Promise<CoachingInsight | null> {
  try {
    const prompt = `Analyze customer engagement level in this meeting. Look for:
- Enthusiasm indicators (positive words, questions, interest)
- Disengagement indicators (short responses, silence, negative tone)

Return JSON:
{
  "engagementLevel": "high" | "medium" | "low",
  "indicators": ["indicator1", "indicator2"]
}

Transcript:
${transcript}

Analysis (JSON only):`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.2,
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content) as { engagementLevel: string; indicators: string[] }

    if (analysis.engagementLevel === 'low') {
      return {
        type: 'engagement',
        severity: 'high',
        message: 'Customer engagement appears low',
        recommendation: 'Increase engagement by asking more relevant questions and showing value.',
      }
    }

    return null
  } catch (error) {
    console.error('Engagement analysis error:', error)
    return null
  }
}

/**
 * Analyze closing attempts
 */
async function analyzeClosingAttempts(
  transcript: string,
  tenantId: string
): Promise<CoachingInsight | null> {
  try {
    const prompt = `Identify closing attempts in this meeting. Return JSON:
{
  "closingAttempts": number,
  "closingPhrases": ["phrase1", "phrase2"]
}

Transcript:
${transcript}

Analysis (JSON only):`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.2,
      max_tokens: 200,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(content) as { closingAttempts: number; closingPhrases: string[] }

    const attempts = analysis.closingAttempts || 0

    if (attempts === 0) {
      return {
        type: 'closing',
        severity: 'medium',
        message: 'No closing attempts identified in the meeting',
        recommendation: 'Practice soft closing techniques. Ask for next steps or commitment.',
      }
    }

    return null
  } catch (error) {
    console.error('Closing analysis error:', error)
    return null
  }
}

/**
 * Process meeting intelligence for an interaction
 */
export async function processMeetingIntelligence(
  interactionId: string,
  transcript: string,
  tenantId: string
): Promise<{
  sentiment: SentimentAnalysis
  summary: MeetingSummary
  insights: CoachingInsight[]
  actionItems: Array<{ text: string; assignee?: string; dueDate?: Date }>
}> {
  // Run all analyses in parallel
  const [sentiment, summary, insights, actionItems] = await Promise.all([
    analyzeSentiment(transcript, tenantId),
    generateMeetingSummary(transcript, tenantId),
    generateCoachingInsights(transcript, interactionId, tenantId),
    extractActionItems(transcript, tenantId),
  ])

  // Save to interaction metadata
  await prisma.interaction.update({
    where: { id: interactionId, tenantId },
    data: {
      metadata: {
        ...((await prisma.interaction.findUnique({ where: { id: interactionId } }))?.metadata as any || {}),
        meetingIntelligence: {
          sentiment,
          summary,
          insights,
          processedAt: new Date().toISOString(),
        },
      },
    },
  })

  return {
    sentiment,
    summary,
    insights,
    actionItems,
  }
}
