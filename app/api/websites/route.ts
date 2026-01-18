import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createWebsiteSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  description: z.string().optional(),
})

// GET /api/websites - List all websites
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const websites = await prisma.website.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ websites })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get websites error:', error)
    return NextResponse.json(
      { error: 'Failed to get websites', websites: [] },
      { status: 500 }
    )
  }
}

// POST /api/websites - Create a new website
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createWebsiteSchema.parse(body)

    const website = await prisma.website.create({
      data: {
        name: validated.name,
        domain: validated.domain,
        // description field doesn't exist in Website model
        tenantId,
        trackingCode: generateTrackingCode(),
      },
    })

    return NextResponse.json(website, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create website error:', error)
    return NextResponse.json(
      { error: 'Failed to create website' },
      { status: 500 }
    )
  }
}

function generateTrackingCode(): string {
  return `payaid_${Math.random().toString(36).substring(2, 15)}`
}
