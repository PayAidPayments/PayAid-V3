import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  let decoded: { user_id?: string; userId?: string }
  try {
    decoded = await requireSuperAdmin() as any
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { taskId } = await params
    const body = await request.json()
    const { action } = body

    if (!['assign', 'complete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const userId = decoded.user_id || decoded.userId || 'system'

    // Handle KYC review tasks
    if (taskId.startsWith('kyc-')) {
      const onboardingId = taskId.replace('kyc-', '')
      
      if (action === 'assign') {
        // Update onboarding record (would store assignedTo in a separate field)
        await prisma.merchantOnboarding.update({
          where: { id: onboardingId },
          data: {
            // Note: Would need to add assignedTo field to schema
          },
        })
      } else if (action === 'complete') {
        // Mark as reviewed (would update status)
        // For now, just return success
      }
    }

    // TODO: Handle other task types (plan changes, data exports, compliance tickets)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Task update error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
