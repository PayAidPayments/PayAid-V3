import type { Quote } from '../components/types'

/** Quote statuses that clear an approval gate for send / health checks. */
export const CPQ_APPROVAL_CLEARED_STATUSES = new Set(['approved', 'accepted', 'converted'])

export function isApprovalGateCleared(approvalRequired: boolean, quoteStatus: string | undefined): boolean {
  if (!approvalRequired) return true
  const s = quoteStatus ?? ''
  return CPQ_APPROVAL_CLEARED_STATUSES.has(s)
}

export function getCanSendQuote(params: {
  selectedQuote: Quote | null
  draftLineCount: number
  pricingTotal: number
  approvalRequired: boolean
}): boolean {
  const { selectedQuote, draftLineCount, pricingTotal, approvalRequired } = params
  if (!selectedQuote) return false
  if (draftLineCount === 0 || pricingTotal <= 0) return false
  return isApprovalGateCleared(approvalRequired, selectedQuote.status)
}

export function getSendQuoteTooltip(params: {
  selectedQuote: Quote | null
  canSend: boolean
  approvalRequired: boolean
}): string {
  const { selectedQuote, canSend, approvalRequired } = params
  if (!selectedQuote) return 'Select a quote first'
  if (canSend) return 'Send quote to customer'
  if (approvalRequired && !isApprovalGateCleared(approvalRequired, selectedQuote.status)) {
    return 'Complete approval before sending'
  }
  return 'Add line items and a valid total before sending'
}
