import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/recruitment/candidates/[id]/match-score
 * Calculate resume match score for a candidate against job requisition
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const jobRequisitionId = searchParams.get('jobRequisitionId')

    if (!jobRequisitionId) {
      return NextResponse.json(
        { error: 'Job requisition ID is required' },
        { status: 400 }
      )
    }

    // Get candidate
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        resume: true,
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Get job requisition
    const jobRequisition = await prisma.jobRequisition.findFirst({
      where: {
        id: jobRequisitionId,
        tenantId,
      },
    })

    if (!jobRequisition) {
      return NextResponse.json({ error: 'Job requisition not found' }, { status: 404 })
    }

    // Calculate match score (simplified algorithm - can be enhanced with NLP/AI)
    let matchScore = 0
    const factors: Array<{ factor: string; score: number; maxScore: number }> = []

    // Experience match (30 points)
    if (candidate.experienceYears && jobRequisition.minExperience) {
      const experienceMatch = Math.min(
        (candidate.experienceYears / jobRequisition.minExperience) * 30,
        30
      )
      matchScore += experienceMatch
      factors.push({
        factor: 'Experience',
        score: experienceMatch,
        maxScore: 30,
      })
    }

    // Skills match (40 points) - would need skill extraction from resume
    // For now, use a placeholder
    const skillsMatch = 25 // Would be calculated from resume parsing
    matchScore += skillsMatch
    factors.push({
      factor: 'Skills Match',
      score: skillsMatch,
      maxScore: 40,
    })

    // Education match (20 points)
    if (candidate.education && jobRequisition.requiredEducation) {
      // Simple matching - would be enhanced with NLP
      const educationMatch = candidate.education
        .toLowerCase()
        .includes(jobRequisition.requiredEducation.toLowerCase())
        ? 20
        : 10
      matchScore += educationMatch
      factors.push({
        factor: 'Education',
        score: educationMatch,
        maxScore: 20,
      })
    }

    // Location match (10 points)
    if (candidate.location && jobRequisition.location) {
      const locationMatch =
        candidate.location.toLowerCase() === jobRequisition.location.toLowerCase() ? 10 : 5
      matchScore += locationMatch
      factors.push({
        factor: 'Location',
        score: locationMatch,
        maxScore: 10,
      })
    }

    // Cap at 100
    matchScore = Math.min(100, matchScore)

    // Determine match level
    let matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    if (matchScore >= 80) {
      matchLevel = 'EXCELLENT'
    } else if (matchScore >= 60) {
      matchLevel = 'GOOD'
    } else if (matchScore >= 40) {
      matchLevel = 'FAIR'
    } else {
      matchLevel = 'POOR'
    }

    // Calculate skill gaps (would come from NLP analysis)
    const skillGaps = [
      'Advanced React.js',
      'TypeScript',
      'AWS Certification',
    ] // Placeholder

    return NextResponse.json({
      candidateId: params.id,
      jobRequisitionId,
      matchScore,
      matchLevel,
      factors,
      skillGaps,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
