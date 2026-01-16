import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// Helper to calculate meeting qualification score
function calculateQualificationScore(meeting: any, contact: any): number {
  let score = 50 // Base score

  // Contact factors
  if (contact.leadScore && contact.leadScore >= 70) score += 20
  else if (contact.leadScore && contact.leadScore >= 50) score += 10

  // Deal factors
  if (contact.deals && contact.deals.length > 0) {
    const totalDealValue = contact.deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
    if (totalDealValue >= 100000) score += 20
    else if (totalDealValue >= 50000) score += 10
  }

  // Interaction history
  if (contact.interactions && contact.interactions.length >= 3) score += 10

  // Meeting type (video/in-person = higher intent)
  if (meeting.meetingType === 'video' || meeting.meetingType === 'in-person') score += 10

  return Math.min(100, score)
}

// GET /api/crm/meetings - Get meetings with AI qualification
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all'

    // Get tasks that are meetings (in production, create Meeting model)
    // For now, use tasks with type='meeting' or similar
    const whereClause: any = {
      tenantId,
      // In production, filter by meeting-specific fields
    }

    // Get tasks that could be meetings
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        contact: {
          include: {
            deals: {
              select: {
                value: true,
              },
            },
            interactions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 100,
    })

    // Transform tasks to meetings format (in production, use actual Meeting model)
    const meetings = tasks
      .filter(task => task.dueDate) // Only tasks with dates
      .map(task => {
        const qualificationScore = calculateQualificationScore(
          { meetingType: 'call' },
          task.contact || {}
        )
        const isQualified = qualificationScore >= 60

        // Determine intent based on score
        let intent: 'high' | 'medium' | 'low' = 'medium'
        if (qualificationScore >= 70) intent = 'high'
        else if (qualificationScore < 50) intent = 'low'

        return {
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          contactId: task.contactId || undefined,
          contactName: task.contact?.name || undefined,
          contactEmail: task.contact?.email || undefined,
          startTime: task.dueDate?.toISOString() || new Date().toISOString(),
          endTime: task.dueDate ? new Date(new Date(task.dueDate).getTime() + 30 * 60 * 1000).toISOString() : new Date().toISOString(),
          status: task.status === 'completed' ? 'completed' : task.status === 'cancelled' ? 'cancelled' : 'scheduled' as const,
          qualificationScore,
          isQualified,
          meetingType: 'call' as const,
          aiInsights: {
            intent,
            recommendedAction: isQualified
              ? 'High-value meeting. Prepare detailed proposal and pricing.'
              : intent === 'medium'
              ? 'Moderate interest. Focus on understanding needs and pain points.'
              : 'Low qualification. Consider quick discovery call or email follow-up.',
            riskFactors: qualificationScore < 50 ? ['Low lead score', 'Limited interaction history'] : [],
          },
        }
      })

    // Apply filters
    let filteredMeetings = meetings
    if (filter === 'upcoming') {
      filteredMeetings = meetings.filter(m => new Date(m.startTime) > new Date() && m.status !== 'cancelled')
    } else if (filter === 'today') {
      const today = new Date()
      filteredMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.startTime)
        return meetingDate.toDateString() === today.toDateString() && m.status !== 'cancelled'
      })
    } else if (filter === 'qualified') {
      filteredMeetings = meetings.filter(m => m.isQualified)
    }

    return NextResponse.json({ meetings: filteredMeetings })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get meetings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings', message: error?.message },
      { status: 500 }
    )
  }
}
