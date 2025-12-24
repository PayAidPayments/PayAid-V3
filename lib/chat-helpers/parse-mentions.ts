/**
 * Chat Mention Parsing
 * Parse @mentions from chat messages and link to CRM
 */

import { prisma } from '@/lib/db/prisma'

export interface ParsedMention {
  type: 'contact' | 'deal' | 'user'
  id: string
  name: string
  startIndex: number
  endIndex: number
}

/**
 * Parse mentions from chat message content
 * Format: @contact-123, @deal-456, @user-789
 */
export function parseMentions(content: string): ParsedMention[] {
  const mentions: ParsedMention[] = []
  const mentionRegex = /@(contact|deal|user)-([a-zA-Z0-9]+)/g

  let match
  while ((match = mentionRegex.exec(content)) !== null) {
    const [fullMatch, type, id] = match
    mentions.push({
      type: type as 'contact' | 'deal' | 'user',
      id,
      name: fullMatch,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    })
  }

  return mentions
}

/**
 * Extract contact IDs from message
 */
export function extractContactIds(content: string): string[] {
  const mentions = parseMentions(content)
  return mentions.filter((m) => m.type === 'contact').map((m) => m.id)
}

/**
 * Extract deal IDs from message
 */
export function extractDealIds(content: string): string[] {
  const mentions = parseMentions(content)
  return mentions.filter((m) => m.type === 'deal').map((m) => m.id)
}

/**
 * Search contacts for autocomplete
 */
export async function searchContactsForMention(
  tenantId: string,
  query: string
): Promise<Array<{ id: string; name: string; email?: string }>> {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    })

    return contacts.map((c) => ({
      id: c.id,
      name: c.name || c.email || 'Unknown',
      email: c.email || undefined,
    }))
  } catch (error) {
    console.error('Search contacts for mention error:', error)
    return []
  }
}

/**
 * Search deals for autocomplete
 */
export async function searchDealsForMention(
  tenantId: string,
  query: string
): Promise<Array<{ id: string; name: string; value?: number }>> {
  try {
    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        status: { not: 'lost' },
      },
      select: {
        id: true,
        name: true,
        value: true,
      },
      take: 10,
    })

    return deals.map((d) => ({
      id: d.id,
      name: d.name,
      value: d.value ? Number(d.value) : undefined,
    }))
  } catch (error) {
    console.error('Search deals for mention error:', error)
    return []
  }
}
