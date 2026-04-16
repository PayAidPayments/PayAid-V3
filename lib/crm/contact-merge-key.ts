/**
 * Pure helpers for Contact 360 merge guard (email / phone / GSTIN overlap).
 * Kept separate from Prisma so rules are unit-testable.
 */

export type MergeKeyFields = {
  email?: string | null
  phone?: string | null
  gstin?: string | null
}

function trimEq(a: string | null | undefined, b: string | null | undefined): boolean {
  const t = (v: string | null | undefined) => (v?.trim() ?? '')
  return t(a).length > 0 && t(a) === t(b)
}

/** Primary must have at least one non-empty identifier to enforce overlap against. */
export function contactHasMergeGuardKey(contact: MergeKeyFields): boolean {
  return Boolean(contact.email?.trim() || contact.phone?.trim() || contact.gstin?.trim())
}

/** True when duplicate shares primary's email, phone, or GSTIN (trimmed, non-empty match). */
export function contactsShare360DuplicateKey(primary: MergeKeyFields, duplicate: MergeKeyFields): boolean {
  return (
    trimEq(primary.email, duplicate.email) ||
    trimEq(primary.phone, duplicate.phone) ||
    trimEq(primary.gstin, duplicate.gstin)
  )
}
