import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const category = request.nextUrl.searchParams.get('category') || undefined
    const templates = await prisma.emailTemplate.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { timesUsed: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })
    return NextResponse.json({ templates })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Marketing email template GET error:', error)
    return NextResponse.json({ error: 'Failed to load email templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    if (validated.isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const created = await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: validated.name,
        category: validated.category || 'marketing',
        subject: validated.subject,
        htmlContent: validated.htmlContent,
        textContent: validated.textContent,
        isDefault: validated.isDefault ?? false,
        isActive: true,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Marketing email template POST error:', error)
    return NextResponse.json({ error: 'Failed to save email template' }, { status: 500 })
  }
}

