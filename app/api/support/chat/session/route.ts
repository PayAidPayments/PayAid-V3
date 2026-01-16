import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/support/chat/session - Get or create chat session
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // For now, return a new session - in production, create ChatSession model
    const session = {
      id: `session_${Date.now()}`,
      status: 'active',
      messages: [],
      aiResolved: false,
    }

    return NextResponse.json({ session })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get chat session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session', message: error?.message },
      { status: 500 }
    )
  }
}
