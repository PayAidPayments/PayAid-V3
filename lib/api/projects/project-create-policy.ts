/**
 * §8-commercial shape on POST /api/projects: client lineage (unless internal),
 * predictable billing defaults, optional deal → contact inheritance.
 */

export function isInternalProjectDelivery(deliveryType: string | null | undefined): boolean {
  return String(deliveryType ?? '').toLowerCase() === 'internal'
}

export function defaultBillingModelForCreate(
  isInternal: boolean,
  explicit: string | null | undefined,
  /** When supplied (§6 service templates), used before **`TIME_AND_MATERIALS`** for commercial projects. */
  templateDefault?: string | null | undefined
): string {
  const t = explicit?.trim()
  if (t) return t
  if (isInternal) return 'NON_BILLABLE'
  const tmpl = templateDefault?.trim()
  if (tmpl) return tmpl
  return 'TIME_AND_MATERIALS'
}

/** Returns resolved client id or `null` (internal projects may omit). */
export function resolveCreateProjectClientId(input: {
  bodyClientId?: string | null
  dealContactId?: string | null
  deliveryType?: string | null
}): { ok: true; clientId: string | null; isInternal: boolean } | { ok: false; error: string } {
  const isInternal = isInternalProjectDelivery(input.deliveryType)
  const fromBody = input.bodyClientId?.trim() || null
  const fromDeal = input.dealContactId?.trim() || null
  const clientId = fromBody ?? fromDeal ?? null
  if (!isInternal && !clientId) {
    return {
      ok: false,
      error:
        'Client required: set clientId, link a CRM deal with a contact, or use deliveryType "internal" for non-billable internal work.',
    }
  }
  return { ok: true, clientId: isInternal ? fromBody : clientId, isInternal }
}

/**
 * Enforces timeline shape for project create:
 * - both `startDate` and `endDate` are required
 * - `endDate` must be on/after `startDate`
 */
export function resolveCreateProjectTimeline(input: {
  startDate?: string | null
  endDate?: string | null
}):
  | { ok: true; startDate: Date; endDate: Date }
  | { ok: false; error: string } {
  const rawStart = input.startDate?.trim() ?? ''
  const rawEnd = input.endDate?.trim() ?? ''

  if (!rawStart || !rawEnd) {
    return {
      ok: false,
      error: 'Project timeline required: provide both startDate and endDate.',
    }
  }

  const startDate = new Date(rawStart)
  const endDate = new Date(rawEnd)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return {
      ok: false,
      error: 'Invalid timeline: startDate and endDate must be valid ISO datetimes.',
    }
  }
  if (endDate.getTime() < startDate.getTime()) {
    return {
      ok: false,
      error: 'Invalid timeline: endDate must be on or after startDate.',
    }
  }

  return { ok: true, startDate, endDate }
}
