/**
 * Resume Matching Algorithm
 * Calculates match score between candidate resume and job requisition
 */

export interface ResumeMatchFactors {
  experienceMatch: number // 0-30 points
  skillsMatch: number // 0-40 points
  educationMatch: number // 0-20 points
  locationMatch: number // 0-10 points
}

export interface ResumeMatchResult {
  matchScore: number // 0-100
  matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  factors: ResumeMatchFactors
  skillGaps: string[]
  strengths: string[]
  recommendations: string[]
}

/**
 * Calculate resume match score
 * This is a simplified version - in production, would use NLP/AI for better matching
 */
export function calculateResumeMatch(
  candidateResume: {
    experienceYears?: number
    skills?: string[]
    education?: string
    location?: string
  },
  jobRequisition: {
    minExperience?: number
    requiredSkills?: string[]
    requiredEducation?: string
    location?: string
  }
): ResumeMatchResult {
  const factors: ResumeMatchFactors = {
    experienceMatch: 0,
    skillsMatch: 0,
    educationMatch: 0,
    locationMatch: 0,
  }

  const skillGaps: string[] = []
  const strengths: string[] = []
  const recommendations: string[] = []

  // Experience match (30 points)
  if (candidateResume.experienceYears && jobRequisition.minExperience) {
    if (candidateResume.experienceYears >= jobRequisition.minExperience) {
      factors.experienceMatch = 30
      strengths.push('Meets/exceeds experience requirement')
    } else {
      const ratio = candidateResume.experienceYears / jobRequisition.minExperience
      factors.experienceMatch = Math.floor(ratio * 30)
      skillGaps.push(`${jobRequisition.minExperience - candidateResume.experienceYears} years of experience`)
    }
  }

  // Skills match (40 points) - most important
  if (candidateResume.skills && jobRequisition.requiredSkills) {
    const candidateSkillsLower = candidateResume.skills.map((s) => s.toLowerCase())
    const requiredSkillsLower = jobRequisition.requiredSkills.map((s) => s.toLowerCase())

    const matchedSkills = requiredSkillsLower.filter((skill) =>
      candidateSkillsLower.some((cs) => cs.includes(skill) || skill.includes(cs))
    )

    factors.skillsMatch = Math.floor((matchedSkills.length / requiredSkillsLower.length) * 40)

    // Find missing skills
    const missingSkills = requiredSkillsLower.filter(
      (skill) => !candidateSkillsLower.some((cs) => cs.includes(skill) || skill.includes(cs))
    )
    skillGaps.push(...missingSkills)

    if (matchedSkills.length > 0) {
      strengths.push(`Has ${matchedSkills.length}/${requiredSkillsLower.length} required skills`)
    }
  }

  // Education match (20 points)
  if (candidateResume.education && jobRequisition.requiredEducation) {
    const candidateEduLower = candidateResume.education.toLowerCase()
    const requiredEduLower = jobRequisition.requiredEducation.toLowerCase()

    if (candidateEduLower.includes(requiredEduLower) || requiredEduLower.includes(candidateEduLower)) {
      factors.educationMatch = 20
      strengths.push('Education requirement met')
    } else {
      factors.educationMatch = 10
      skillGaps.push(`Education: ${jobRequisition.requiredEducation}`)
    }
  }

  // Location match (10 points)
  if (candidateResume.location && jobRequisition.location) {
    if (candidateResume.location.toLowerCase() === jobRequisition.location.toLowerCase()) {
      factors.locationMatch = 10
      strengths.push('Location match')
    } else {
      factors.locationMatch = 5
      recommendations.push('Consider remote work or relocation')
    }
  }

  // Calculate total score
  const matchScore = Math.min(
    100,
    factors.experienceMatch +
      factors.skillsMatch +
      factors.educationMatch +
      factors.locationMatch
  )

  // Determine match level
  let matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  if (matchScore >= 80) {
    matchLevel = 'EXCELLENT'
    recommendations.push('Strong candidate - prioritize for interview')
  } else if (matchScore >= 60) {
    matchLevel = 'GOOD'
    recommendations.push('Good match - proceed with interview')
  } else if (matchScore >= 40) {
    matchLevel = 'FAIR'
    recommendations.push('Consider if other factors are strong')
  } else {
    matchLevel = 'POOR'
    recommendations.push('May not be a good fit - review carefully')
  }

  return {
    matchScore,
    matchLevel,
    factors,
    skillGaps,
    strengths,
    recommendations,
  }
}
