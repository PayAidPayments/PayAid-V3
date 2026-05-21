/** Side-effect tools that must return a draft unless `args.confirmed === true`. */
const DRAFT_FIRST_TOOL_NAMES = new Set([
  'send_payment_link',
  'send_invoice',
  'create_payment',
  'charge_payment',
  'refund_payment',
  'transfer_funds',
  'execute_payment',
])

export function isDraftFirstToolName(name: string): boolean {
  const normalized = name.trim().toLowerCase()
  if (DRAFT_FIRST_TOOL_NAMES.has(normalized)) return true
  return /(payment|invoice|refund|charge|payout|transfer)/i.test(normalized)
}
