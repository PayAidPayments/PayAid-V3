/**
 * Duplicate Contact Detection Service
 * Finds and merges duplicate contacts
 */

import { prisma } from '@/lib/db/prisma'

export interface DuplicateMatch {
  contact1: { id: string; name: string; email?: string; phone?: string }
  contact2: { id: string; name: string; email?: string; phone?: string }
  similarityScore: number // 0-100
  matchReasons: string[]
}

export class DuplicateDetectorService {
  /**
   * Find duplicate contacts
   */
  static async findDuplicates(
    tenantId: string,
    threshold: number = 70
  ): Promise<DuplicateMatch[]> {
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
      },
    })

    const duplicates: DuplicateMatch[] = []
    const processed = new Set<string>()

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const pairKey = `${contacts[i].id}-${contacts[j].id}`
        if (processed.has(pairKey)) continue

        const similarity = this.calculateSimilarity(contacts[i], contacts[j])
        if (similarity.score >= threshold) {
          duplicates.push({
            contact1: {
              id: contacts[i].id,
              name: contacts[i].name,
              email: contacts[i].email || undefined,
              phone: contacts[i].phone || undefined,
            },
            contact2: {
              id: contacts[j].id,
              name: contacts[j].name,
              email: contacts[j].email || undefined,
              phone: contacts[j].phone || undefined,
            },
            similarityScore: similarity.score,
            matchReasons: similarity.reasons,
          })
          processed.add(pairKey)
        }
      }
    }

    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore)
  }

  /**
   * Calculate similarity between two contacts
   */
  private static calculateSimilarity(
    contact1: { name: string; email?: string | null; phone?: string | null; company?: string | null },
    contact2: { name: string; email?: string | null; phone?: string | null; company?: string | null }
  ): { score: number; reasons: string[] } {
    let score = 0
    const reasons: string[] = []

    // Email match (exact) - 50 points
    if (contact1.email && contact2.email && contact1.email.toLowerCase() === contact2.email.toLowerCase()) {
      score += 50
      reasons.push('Email match')
    }

    // Phone match (exact) - 40 points
    if (contact1.phone && contact2.phone && this.normalizePhone(contact1.phone) === this.normalizePhone(contact2.phone)) {
      score += 40
      reasons.push('Phone match')
    }

    // Name similarity - 30 points max
    const nameSimilarity = this.stringSimilarity(contact1.name, contact2.name)
    if (nameSimilarity > 0.8) {
      score += 30
      reasons.push('Name similarity')
    } else if (nameSimilarity > 0.6) {
      score += 15
      reasons.push('Partial name match')
    }

    // Company match - 20 points
    if (contact1.company && contact2.company && contact1.company.toLowerCase() === contact2.company.toLowerCase()) {
      score += 20
      reasons.push('Company match')
    }

    return { score: Math.min(score, 100), reasons }
  }

  /**
   * Normalize phone number for comparison
   */
  private static normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, '').replace(/^0/, '')
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private static stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = this.levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase()
    )

    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Merge duplicate contacts
   */
  static async mergeContacts(
    tenantId: string,
    primaryContactId: string,
    duplicateContactId: string
  ) {
    const primary = await prisma.contact.findFirst({
      where: { id: primaryContactId, tenantId },
      include: {
        deals: true,
        tasks: true,
        interactions: true,
        emailMessages: true,
        formSubmissions: true,
      },
    })

    const duplicate = await prisma.contact.findFirst({
      where: { id: duplicateContactId, tenantId },
      include: {
        deals: true,
        tasks: true,
        interactions: true,
        emailMessages: true,
        formSubmissions: true,
      },
    })

    if (!primary || !duplicate) {
      throw new Error('Contact not found')
    }

    // Merge data (keep primary, fill gaps from duplicate)
    const mergedData: any = {
      ...(primary.name || duplicate.name ? { name: primary.name || duplicate.name } : {}),
      ...(primary.email || duplicate.email ? { email: primary.email || duplicate.email } : {}),
      ...(primary.phone || duplicate.phone ? { phone: primary.phone || duplicate.phone } : {}),
      ...(primary.company || duplicate.company ? { company: primary.company || duplicate.company } : {}),
      ...(primary.address || duplicate.address ? { address: primary.address || duplicate.address } : {}),
      ...(primary.city || duplicate.city ? { city: primary.city || duplicate.city } : {}),
      ...(primary.state || duplicate.state ? { state: primary.state || duplicate.state } : {}),
      ...(primary.postalCode || duplicate.postalCode ? { postalCode: primary.postalCode || duplicate.postalCode } : {}),
      // Merge tags
      tags: [...new Set([...primary.tags, ...duplicate.tags])],
      // Merge notes
      notes: [primary.notes, duplicate.notes].filter(Boolean).join('\n\n---\n\n'),
      // Use higher lead score
      leadScore: Math.max(primary.leadScore, duplicate.leadScore),
      // Use most recent lastContactedAt
      lastContactedAt: primary.lastContactedAt && duplicate.lastContactedAt
        ? new Date(Math.max(primary.lastContactedAt.getTime(), duplicate.lastContactedAt.getTime()))
        : primary.lastContactedAt || duplicate.lastContactedAt,
    }

    // Update primary contact with merged data
    await prisma.contact.update({
      where: { id: primaryContactId },
      data: mergedData,
    })

    // Move deals to primary contact
    await prisma.deal.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: primaryContactId },
    })

    // Move tasks to primary contact
    await prisma.task.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: primaryContactId },
    })

    // Move interactions to primary contact
    await prisma.interaction.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: primaryContactId },
    })

    // Move email messages to primary contact
    await prisma.emailMessage.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: primaryContactId },
    })

    // Move form submissions to primary contact
    await prisma.formSubmission.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: primaryContactId },
    })

    // Delete duplicate contact
    await prisma.contact.delete({
      where: { id: duplicateContactId },
    })

    return {
      success: true,
      primaryContactId,
      mergedContactId: duplicateContactId,
      message: 'Contacts merged successfully',
    }
  }
}
