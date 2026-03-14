import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const sequenceStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  channel: z.enum(['email', 'whatsapp', 'sms']),
  delayDays: z.number().min(0),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  templateId: z.string().optional(),
})

const createSequenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  steps: z.array(sequenceStepSchema).min(1, 'At least one step is required'),
})

// GET /api/marketing/sequences - Get all sequences
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    // For now, return empty array as sequences are stored in NurtureTemplate
    // In production, you might want to create a separate Sequence model
    // or enhance NurtureTemplate to support multi-channel sequences
    
    const templates = await prisma.nurtureTemplate.findMany({
      where: { tenantId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        enrollments: {
          select: {
            id: true,
            status: true,
            completedSteps: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform templates to sequences format
    const sequences = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      steps: template.steps.map(step => ({
        id: step.id,
        order: step.order,
        channel: (step.channel || 'email') as 'email' | 'whatsapp' | 'sms',
        delayDays: step.dayNumber || 0,
        subject: step.subject || undefined,
        content: step.body || '',
        templateId: step.id,
      })),
      status: 'active' as const, // Can be enhanced based on template status
      enrolledCount: template.enrollments?.length || 0,
      completedCount: template.enrollments?.filter(e => e.status === 'COMPLETED').length || 0,
      createdAt: template.createdAt.toISOString(),
    }))

    return NextResponse.json({ sequences })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get sequences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sequences', message: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/marketing/sequences - Create a new sequence
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    const body = await request.json()
    const validated = createSequenceSchema.parse(body)

    // Create sequence as NurtureTemplate with steps
    const template = await prisma.nurtureTemplate.create({
      data: {
        name: validated.name,
        description: validated.description || '',
        tenantId,
        steps: {
          create: validated.steps.map(step => ({
            order: step.order,
            dayNumber: step.delayDays,
            channel: step.channel,
            subject: step.subject || null,
            body: step.content,
          })),
        },
      },
      include: {
        steps: true,
      },
    })

    return NextResponse.json({
      success: true,
      sequence: {
        id: template.id,
        name: template.name,
        description: template.description || '',
        steps: template.steps.map(step => ({
          id: step.id,
          order: step.order,
          channel: (step.channel || 'email') as 'email' | 'whatsapp' | 'sms',
          delayDays: step.dayNumber || 0,
          subject: step.subject || undefined,
          content: step.body || '',
        })),
        status: 'active' as const,
        enrolledCount: 0,
        completedCount: 0,
        createdAt: template.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create sequence error:', error)
    return NextResponse.json(
      { error: 'Failed to create sequence', message: error?.message },
      { status: 500 }
    )
  }
}
