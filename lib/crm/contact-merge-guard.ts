/**
 * Server-side guard: merge only when the pair matches Contact 360
 * `duplicateSuggestions` rules (same tenant; duplicate shares primary’s email, phone, or GSTIN).
 * Integrations can set `bypassDuplicateSuggestionGuard` when operators confirm out-of-band.
 */

import { prisma } from '@/lib/db/prisma'

export type MergeGuardResult =
  | { allowed: true }
  | { allowed: false; status: 409 | 400; message: string }

function trimEq(a: string | null | undefined, b: string | null | undefined): boolean {
  const t = (v: string | null | undefined) => (v?.trim() ?? '')
  return t(a).length > 0 && t(a) === t(b)
}

export async function assertContactMergeAllowedBy360Suggestions(
  tenantId: string,
  primaryContactId: string,
  duplicateContactId: string,
  options: { bypassGuard?: boolean }
): Promise<MergeGuardResult> {
  if (options.bypassGuard) {
    return { allowed: true }
  }

  const [primary, duplicate] = await Promise.all([
    prisma.contact.findFirst({
      where: { id: primaryContactId, tenantId },
      select: { id: true, email: true, phone: true, gstin: true },
    }),
    prisma.contact.findFirst({
      where: { id: duplicateContactId, tenantId },
      select: { id: true, email: true, phone: true, gstin: true },
    }),
  ])

  if (!primary || !duplicate) {
    return { allowed: false, status: 400, message: 'Contact not found' }
  }

  const primaryHasKey = Boolean(primary.email?.trim() || primary.phone?.trim() || primary.gstin?.trim())
  if (!primaryHasKey) {
    return {
      allowed: false,
      status: 409,
      message:
        'Merge guard: this contact has no email, phone, or GSTIN to verify the duplicate match. Retry with bypassDuplicateSuggestionGuard: true if you intend to merge anyway.',
    }
  }

  const emailMatch = trimEq(primary.email, duplicate.email)
  const phoneMatch = trimEq(primary.phone, duplicate.phone)
  const gstinMatch = trimEq(primary.gstin, duplicate.gstin)

  if (emailMatch || phoneMatch || gstinMatch) {
    return { allowed: true }
  }

  return {
    allowed: false,
    status: 409,
    message:
      'Merge guard: the other contact does not share this contact’s email, phone, or GSTIN (same rules as Contact 360 suggestions). To merge anyway, send bypassDuplicateSuggestionGuard: true.',
  }
}
