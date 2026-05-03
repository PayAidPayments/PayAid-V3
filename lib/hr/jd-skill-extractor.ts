/**
 * Deferred Phase 2: Extract skills/keywords from job title and description for resume matching.
 * Used by rank-candidates to improve match scoring when JD text is available.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'engineer', 'manager', 'lead', 'senior', 'junior', 'associate', 'executive', 'analyst', 'developer',
  'experience', 'years', 'year', 'required', 'preferred', 'knowledge', 'ability', 'skills', 'role',
])

export function extractSkillsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return []
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s+-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
  return [...new Set(normalized)]
}

export function extractSkillsFromJob(title: string, description?: string | null): string[] {
  const combined = description ? `${title} ${description}` : title
  return extractSkillsFromText(combined)
}
