/**
 * Call transcripts search
 * GET /api/v1/voice-agents/transcripts
 * Query: q (full-text search), startDate, endDate, language, sentiment, limit
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const language = searchParams.get('language')
    const sentiment = searchParams.get('sentiment')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    type WhereClause = {
      tenantId: string
      OR?: Array<
        | { transcript: { contains: string; mode: 'insensitive' } }
        | { messages: { some: { content: { contains: string; mode: 'insensitive' } } } }
      >
      createdAt?: { gte?: Date; lte?: Date }
      languageUsed?: string
      metadata?: { is: { sentiment: string } }
    }
    const where: WhereClause = {
      tenantId: user.tenantId,
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: end }
    }
    if (language) {
      where.languageUsed = language
    }
    if (sentiment) {
      where.metadata = { is: { sentiment } }
    }

    if (q) {
      where.OR = [
        { transcript: { contains: q, mode: 'insensitive' } },
        { messages: { some: { content: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    const calls = await prisma.voiceAgentCall.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        metadata: { select: { sentiment: true, sentimentScore: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      transcripts: calls.map((c) => ({
        id: c.id,
        callSid: c.callSid,
        agentId: c.agentId,
        agentName: c.agent?.name,
        phone: c.phone ?? c.from,
        inbound: c.inbound,
        status: c.status,
        languageUsed: c.languageUsed,
        transcript: c.transcript,
        recordingUrl: c.recordingUrl,
        sentiment: c.metadata?.sentiment,
        sentimentScore: c.metadata?.sentimentScore,
        startTime: c.startTime,
        endTime: c.endTime,
        durationSeconds: c.durationSeconds,
        createdAt: c.createdAt,
        messages: undefined,
      })),
      total: calls.length,
    })
  } catch (error) {
    console.error('[Transcripts] GET error:', error)
    return NextResponse.json({ error: 'Failed to search transcripts' }, { status: 500 })
  }
}
