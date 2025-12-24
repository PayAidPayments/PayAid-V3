/**
 * Background job to recalculate lead scores
 * Runs hourly to keep scores up-to-date
 */

import { prisma } from '@/lib/db/prisma'
import { updateLeadScore } from '@/lib/ai-helpers/lead-scoring'

export async function recalculateAllLeadScores(tenantId?: string) {
  const where: any = {
    type: 'lead',
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  const contacts = await prisma.contact.findMany({
    where,
    select: {
      id: true,
    },
  })

  console.log(`Recalculating scores for ${contacts.length} leads...`)

  let successCount = 0
  let errorCount = 0

  for (const contact of contacts) {
    try {
      await updateLeadScore(contact.id)
      successCount++
    } catch (error) {
      console.error(`Failed to update score for contact ${contact.id}:`, error)
      errorCount++
    }
  }

  console.log(
    `Score recalculation complete: ${successCount} succeeded, ${errorCount} failed`
  )

  return {
    total: contacts.length,
    success: successCount,
    errors: errorCount,
  }
}
