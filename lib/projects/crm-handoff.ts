/** Tag conventions for CRM → Projects handoff (no schema migration). */
export const CRM_SOURCE_TAG = 'source:crm'
export const CRM_DEAL_TAG_PREFIX = 'crmDeal:'

export function crmDealTag(dealId: string): string {
  return `${CRM_DEAL_TAG_PREFIX}${dealId}`
}

export function parseCrmDealIdFromTags(tags: string[] | undefined | null): string | null {
  if (!tags?.length) return null
  const tag = tags.find((t) => t.startsWith(CRM_DEAL_TAG_PREFIX))
  return tag ? tag.slice(CRM_DEAL_TAG_PREFIX.length) : null
}

export function mergeCrmHandoffTags(
  tags: string[] | undefined,
  options: { dealId?: string | null; crmSource?: string | null }
): string[] {
  const withoutHandoff = (tags ?? []).filter(
    (t) => t !== CRM_SOURCE_TAG && !t.startsWith(CRM_DEAL_TAG_PREFIX)
  )
  const next = [...withoutHandoff]
  if (options.crmSource === 'crm' || options.dealId) {
    next.push(CRM_SOURCE_TAG)
  }
  if (options.dealId) {
    next.push(crmDealTag(options.dealId))
  }
  return [...new Set(next)]
}
