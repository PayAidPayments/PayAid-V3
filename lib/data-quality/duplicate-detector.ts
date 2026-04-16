/**
 * Duplicate Contact Detection Service
 * Finds and merges duplicate contacts
 */

import { Prisma } from '@prisma/client'
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
   * Merge duplicate contacts: reassigns related records to the primary, merges scalars, deletes the duplicate.
   */
  static async mergeContacts(
    tenantId: string,
    primaryContactId: string,
    duplicateContactId: string
  ) {
    if (primaryContactId === duplicateContactId) {
      throw new Error('Cannot merge a contact with itself')
    }

    return prisma.$transaction(async (tx) => {
      const warnings: string[] = []
      const notices: string[] = []

      const primary = await tx.contact.findFirst({
        where: { id: primaryContactId, tenantId },
      })
      const duplicate = await tx.contact.findFirst({
        where: { id: duplicateContactId, tenantId },
      })

      if (!primary || !duplicate) {
        throw new Error('Contact not found')
      }

      const mergedData: Prisma.ContactUncheckedUpdateInput = {
        name: primary.name || duplicate.name,
        email: primary.email ?? duplicate.email ?? undefined,
        phone: primary.phone ?? duplicate.phone ?? undefined,
        company: primary.company ?? duplicate.company ?? undefined,
        address: primary.address ?? duplicate.address ?? undefined,
        city: primary.city ?? duplicate.city ?? undefined,
        state: primary.state ?? duplicate.state ?? undefined,
        postalCode: primary.postalCode ?? duplicate.postalCode ?? undefined,
        country: primary.country ?? duplicate.country ?? undefined,
        gstin: primary.gstin ?? duplicate.gstin ?? undefined,
        accountId: primary.accountId ?? duplicate.accountId ?? undefined,
        sourceId: primary.sourceId ?? duplicate.sourceId ?? undefined,
        source: primary.source ?? duplicate.source ?? undefined,
        assignedToId: primary.assignedToId ?? duplicate.assignedToId ?? undefined,
        tags: [...new Set([...primary.tags, ...duplicate.tags])],
        notes: [primary.notes, duplicate.notes].filter(Boolean).join('\n\n---\n\n') || undefined,
        internalNotes:
          [
            (primary as { internalNotes?: string | null }).internalNotes,
            (duplicate as { internalNotes?: string | null }).internalNotes,
          ]
            .filter((s): s is string => Boolean(s && String(s).trim()))
            .join('\n\n---\n\n') || undefined,
        leadScore: Math.max(primary.leadScore, duplicate.leadScore),
        lastContactedAt:
          primary.lastContactedAt && duplicate.lastContactedAt
            ? new Date(Math.max(primary.lastContactedAt.getTime(), duplicate.lastContactedAt.getTime()))
            : primary.lastContactedAt ?? duplicate.lastContactedAt ?? undefined,
        nextFollowUp:
          primary.nextFollowUp && duplicate.nextFollowUp
            ? new Date(Math.min(primary.nextFollowUp.getTime(), duplicate.nextFollowUp.getTime()))
            : primary.nextFollowUp ?? duplicate.nextFollowUp ?? undefined,
      }

      await tx.contact.update({
        where: { id: primaryContactId },
        data: mergedData,
      })

      await tx.customerInsight.deleteMany({ where: { contactId: duplicateContactId } })

      const dupLoyalty = await tx.loyaltyPoints.findMany({
        where: { customerId: duplicateContactId },
      })
      for (const row of dupLoyalty) {
        const primaryRow = await tx.loyaltyPoints.findUnique({
          where: {
            tenantId_programId_customerId: {
              tenantId: row.tenantId,
              programId: row.programId,
              customerId: primaryContactId,
            },
          },
        })
        if (primaryRow) {
          await tx.loyaltyPoints.update({
            where: { id: primaryRow.id },
            data: {
              currentPoints: new Prisma.Decimal(primaryRow.currentPoints).add(row.currentPoints),
              totalEarned: new Prisma.Decimal(primaryRow.totalEarned).add(row.totalEarned),
              totalRedeemed: new Prisma.Decimal(primaryRow.totalRedeemed).add(row.totalRedeemed),
              tier: primaryRow.tier ?? row.tier ?? undefined,
              lastTransactionAt: (() => {
                const a = primaryRow.lastTransactionAt?.getTime() ?? 0
                const b = row.lastTransactionAt?.getTime() ?? 0
                if (a === 0 && b === 0) return undefined
                return new Date(Math.max(a, b))
              })(),
              pointsExpiryAt: (() => {
                const a = primaryRow.pointsExpiryAt?.getTime()
                const b = row.pointsExpiryAt?.getTime()
                if (a == null && b == null) return undefined
                if (a == null) return row.pointsExpiryAt
                if (b == null) return primaryRow.pointsExpiryAt
                return new Date(Math.min(a, b))
              })(),
            },
          })
          await tx.loyaltyTransaction.updateMany({
            where: { pointsId: row.id },
            data: { pointsId: primaryRow.id },
          })
          await tx.loyaltyPoints.delete({ where: { id: row.id } })
        } else {
          await tx.loyaltyPoints.update({
            where: { id: row.id },
            data: { customerId: primaryContactId },
          })
        }
      }

      const dupWa = await tx.whatsappConversation.findMany({
        where: { contactId: duplicateContactId },
      })
      for (const c of dupWa) {
        const existing = await tx.whatsappConversation.findFirst({
          where: { accountId: c.accountId, contactId: primaryContactId },
        })
        if (existing) {
          const messageCount = await tx.whatsappMessage.count({
            where: { conversationId: c.id },
          })
          if (messageCount > 0) {
            await tx.whatsappMessage.updateMany({
              where: { conversationId: c.id },
              data: { conversationId: existing.id },
            })
            const priT = existing.lastMessageAt?.getTime() ?? 0
            const dupT = c.lastMessageAt?.getTime() ?? 0
            const nextLastMs = Math.max(priT, dupT)
            await tx.whatsappConversation.update({
              where: { id: existing.id },
              data: {
                ...(nextLastMs > 0 ? { lastMessageAt: new Date(nextLastMs) } : {}),
                unreadCount: existing.unreadCount + c.unreadCount,
              },
            })
            notices.push(
              `WhatsApp: merged ${messageCount} message${messageCount === 1 ? '' : 's'} from a duplicate thread into the existing conversation for this WhatsApp account.`
            )
          } else {
            notices.push(
              'WhatsApp: removed an empty duplicate conversation (same WhatsApp account as an existing thread).'
            )
          }
          await tx.whatsappConversation.delete({ where: { id: c.id } })
        } else {
          await tx.whatsappConversation.update({
            where: { id: c.id },
            data: { contactId: primaryContactId },
          })
        }
      }

      await tx.deal.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.task.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.interaction.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.emailMessage.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.emailContact.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.formSubmission.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.order.updateMany({
        where: { customerId: duplicateContactId },
        data: { customerId: primaryContactId },
      })
      await tx.invoice.updateMany({
        where: { customerId: duplicateContactId },
        data: { customerId: primaryContactId },
      })
      await tx.creditNote.updateMany({
        where: { customerId: duplicateContactId },
        data: { customerId: primaryContactId },
      })
      await tx.debitNote.updateMany({
        where: { customerId: duplicateContactId },
        data: { customerId: primaryContactId },
      })
      await tx.scheduledEmail.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.nurtureEnrollment.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.whatsappContactIdentity.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.sMSDeliveryReport.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.realEstateAdvance.updateMany({
        where: { customerId: duplicateContactId },
        data: { customerId: primaryContactId },
      })
      await tx.project.updateMany({
        where: { clientId: duplicateContactId },
        data: { clientId: primaryContactId },
      })
      await tx.workOrder.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.quote.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.proposal.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.contract.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.appointment.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.surveyResponse.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })
      await tx.healthcarePatient.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      })

      await tx.contact.delete({
        where: { id: duplicateContactId },
      })

      return {
        success: true,
        primaryContactId,
        mergedContactId: duplicateContactId,
        message: 'Contacts merged successfully',
        ...(warnings.length > 0 ? { warnings } : {}),
        ...(notices.length > 0 ? { notices } : {}),
      }
    })
  }
}
