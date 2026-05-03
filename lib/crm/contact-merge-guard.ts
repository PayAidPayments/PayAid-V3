/**
 * Server-side guard: merge only when the pair matches Contact 360
 * `duplicateSuggestions` rules (same tenant; duplicate shares primary’s email, phone, or GSTIN).
 * Integrations can set `bypassDuplicateSuggestionGuard` when operators confirm out-of-band.
 */

import { prisma } from '@/lib/db/prisma'
import {
  contactHasMergeGuardKey,
  contactsShare360DuplicateKey,
} from '@/lib/crm/contact-merge-key'

export type MergeGuardResult =
  | { allowed: true }
  | { allowed: false; status: 404 | 409 | 400; message: string; code?: string }

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
    return {
      allowed: false,
      status: 404,
      code: 'MERGE_CONTACT_NOT_FOUND',
      message: 'One or both contacts were not found in this workspace.',
    }
  }

  if (!contactHasMergeGuardKey(primary)) {
    return {
      allowed: false,
      status: 409,
      code: 'MERGE_GUARD_NO_PRIMARY_KEY',
      message:
        'Merge guard: this contact has no email, phone, or GSTIN to verify the duplicate match. Retry with bypassDuplicateSuggestionGuard: true if you intend to merge anyway.',
    }
  }

  if (contactsShare360DuplicateKey(primary, duplicate)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    status: 409,
    code: 'MERGE_GUARD_NO_OVERLAP',
    message:
      'Merge guard: the other contact does not share this contact’s email, phone, or GSTIN (same rules as Contact 360 suggestions). To merge anyway, send bypassDuplicateSuggestionGuard: true.',
  }
}
