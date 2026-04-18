import type { DraftLineItem } from '../components/types'

export type PatchLineItemPayload = {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_rate: number
}

export function draftLineItemsToPatchPayload(draftLineItems: DraftLineItem[]): { line_items: PatchLineItemPayload[] } {
  return {
    line_items: draftLineItems.map((li) => ({
      description: li.item || li.description,
      quantity: Math.max(1, Math.round(Number(li.qty) || 1)),
      unit_price: li.unitPrice,
      tax_rate: li.taxRate,
      discount_rate: Math.min(0.99, Math.max(0, li.discountRate)),
    })),
  }
}
