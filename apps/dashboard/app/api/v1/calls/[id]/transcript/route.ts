import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { z } from 'zod'

const transcriptSegmentSchema = z.object({
  speaker: z.enum(['agent', 'customer', 'unknown']).default('unknown'),
  text: z.string(),
  start_ms: z.number().int().nonnegative(),
  end_ms: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1).default(1),
  redacted: z.boolean().default(false),
})

const ingestTranscriptBodySchema = z.object({
  transcript: z.string().min(1, 'Transcript text is required'),
  segments: z.array(transcriptSegmentSchema).optional(),
  language: z.string().default('en'),
  sentiment: z.string().optional(),
  sentiment_score: z.number().min(-1).max(1).optional(),
  key_points: z.array(z.string()).optional(),
  action_items: z.array(z.string()).optional(),
})

/**
 * POST /api/v1/calls/[id]/transcript
 * Ingest a transcript for a specific call (:id = AICall.id).
 * Idempotent: updates existing transcript if one already exists for the call.
 * Wires to CallTranscript model and callTranscriptSchema from M2 contracts.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_voice')
    const { id: callId } = await params

    // Verify the call exists BEFORE body validation so 404 takes precedence
    const call = await prisma.aICall.findFirst({
      where: { id: callId, tenantId },
      select: { id: true, status: true, phoneNumber: true },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = ingestTranscriptBodySchema.parse(body)

    // Idempotent upsert — replace existing transcript for this call
    const existing = await prisma.callTranscript.findFirst({
      where: { callId, tenantId },
      select: { id: true },
    })

    const transcriptData = {
      tenantId,
      callId,
      transcript: validated.transcript,
       
      segments: validated.segments ? (validated.segments as any) : undefined,
      language: validated.language,
      sentiment: validated.sentiment,
      sentimentScore: validated.sentiment_score !== undefined
        ? validated.sentiment_score
        : undefined,
       
      keyPoints: validated.key_points ? (validated.key_points as any) : undefined,
       
      actionItems: validated.action_items ? (validated.action_items as any) : undefined,
    }

    let transcript
    let wasUpdated = false

    if (existing) {
      transcript = await prisma.callTranscript.update({
        where: { id: existing.id },
        data: transcriptData,
        select: {
          id: true,
          callId: true,
          language: true,
          sentiment: true,
          createdAt: true,
        },
      })
      wasUpdated = true
    } else {
      transcript = await prisma.callTranscript.create({
        data: transcriptData,
        select: {
          id: true,
          callId: true,
          language: true,
          sentiment: true,
          createdAt: true,
        },
      })
    }

    const segmentCount = validated.segments?.length ?? 0
    const redactedCount = validated.segments?.filter((s) => s.redacted).length ?? 0

    // Non-fatal audit trail
    prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'call_transcript',
        entityId: transcript.id,
        changedBy: userId ?? 'system',
        changeSummary: wasUpdated ? 'transcript_updated' : 'transcript_created',
        afterSnapshot: {
          call_id: callId,
          language: validated.language,
          sentiment: validated.sentiment ?? null,
          segment_count: segmentCount,
          redacted_count: redactedCount,
          was_updated: wasUpdated,
           
        } as any,
      },
    }).catch(() => { /* non-fatal */ })

    return NextResponse.json(
      {
        success: true,
        transcript: {
          id: transcript.id,
          call_id: transcript.callId,
          language: transcript.language,
          sentiment: transcript.sentiment,
          segment_count: segmentCount,
          redacted_count: redactedCount,
          word_count: validated.transcript.split(/\s+/).filter(Boolean).length,
          created_at: transcript.createdAt,
        },
        was_updated: wasUpdated,
        schema_version: '1.0',
      },
      { status: wasUpdated ? 200 : 201 }
    )
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Ingest transcript error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to ingest transcript' },
      { status: 500 }
    )
  }
}

/** GET /api/v1/calls/[id]/transcript — Fetch the transcript for a call */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_voice')
    const { id: callId } = await params

    const transcript = await prisma.callTranscript.findFirst({
      where: { callId, tenantId },
    })

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found for this call' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript.id,
        call_id: transcript.callId,
        transcript: transcript.transcript,
        segments: transcript.segments,
        language: transcript.language,
        sentiment: transcript.sentiment,
        sentiment_score: transcript.sentimentScore,
        key_points: transcript.keyPoints,
        action_items: transcript.actionItems,
        created_at: transcript.createdAt,
        schema_version: '1.0',
      },
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('Get transcript error:', e)
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 })
  }
}
