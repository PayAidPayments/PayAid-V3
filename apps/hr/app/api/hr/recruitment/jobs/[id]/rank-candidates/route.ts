import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { extractSkillsFromJob } from '@/lib/hr/jd-skill-extractor'

/**
 * POST /api/hr/recruitment/jobs/[id]/rank-candidates
 * Phase 2: Rank all candidates for a job by match score (Resume Screening AI)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: jobRequisitionId } = await params

    const job = await prisma.jobRequisition.findFirst({
      where: { id: jobRequisitionId, tenantId },
      include: { location: true, candidateJobs: { include: { candidate: true } } },
    })
    if (!job) {
      return NextResponse.json({ error: 'Job requisition not found' }, { status: 404 })
    }

    const candidates = job.candidateJobs.map((cj) => cj.candidate)

    const jobSkills = extractSkillsFromJob(job.title)
    const titleWords = jobSkills.length > 0 ? jobSkills : job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    const jobLoc = job.location?.name ?? job.location?.city ?? ''

    const scored = candidates.map((c) => {
      const candidateSkills = (c.skills || []).map((s) => String(s).toLowerCase())
      const skillsInTitle = candidateSkills.filter((s) =>
        titleWords.some((w) => s.includes(w) || w.includes(s))
      )
      const skillsMatch = titleWords.length > 0
        ? Math.min(40, (skillsInTitle.length / Math.max(titleWords.length, 1)) * 40)
        : candidateSkills.length > 0 ? 20 : 10

      const experienceProxy = c.noticePeriodDays != null
        ? Math.min(30, (c.noticePeriodDays / 90) * 30)
        : candidateSkills.length >= 5 ? 25 : candidateSkills.length >= 2 ? 15 : 10

      const candLoc = (c.location ?? '').toLowerCase()
      const locMatch = jobLoc && candLoc
        ? (candLoc.includes(jobLoc.toLowerCase()) || jobLoc.toLowerCase().includes(candLoc)) ? 20 : 10
        : 0

      const hasCtc = c.expectedCtcInr != null || c.currentCtcInr != null
      const completeness = (candidateSkills.length > 0 ? 5 : 0) + (c.location ? 3 : 0) + (hasCtc ? 2 : 0)

      const matchScore = Math.min(100, Math.round(skillsMatch + experienceProxy + locMatch + completeness))
      const skillGaps = titleWords.filter(
        (w) => w.length > 3 && !candidateSkills.some((s) => s.includes(w) || w.includes(s))
      ).slice(0, 5)

      let matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
      if (matchScore >= 80) matchLevel = 'EXCELLENT'
      else if (matchScore >= 60) matchLevel = 'GOOD'
      else if (matchScore >= 40) matchLevel = 'FAIR'
      else matchLevel = 'POOR'

      return {
        candidateId: c.id,
        fullName: c.fullName,
        email: c.email,
        matchScore,
        matchLevel,
        skillGaps,
      }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      jobRequisitionId,
      jobTitle: job.title,
      totalCandidates: scored.length,
      ranked: scored,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
