import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DraftLineItem } from './types'
import { formatINR } from './utils'

type QuoteLineItemsTableProps = {
  draftLineItems: DraftLineItem[]
  onQtyChange: (id: string, qty: number) => void
}

export function QuoteLineItemsTable({ draftLineItems, onQtyChange }: QuoteLineItemsTableProps) {
  return (
    <div className="overflow-auto" data-testid="cpq-line-items">
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr className="text-xs text-slate-500 border-b">
            <th className="text-left py-2">Item</th>
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Unit Price</th>
            <th className="text-right py-2">Discount</th>
            <th className="text-right py-2">Tax</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {draftLineItems.map((li) => {
            const lineBase = li.qty * li.unitPrice
            const lineDiscount = lineBase * li.discountRate
            const lineTax = (lineBase - lineDiscount) * li.taxRate
            const lineTotal = lineBase - lineDiscount + lineTax
            return (
              <tr key={li.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span>{li.item}</span>
                    {li.badge ? <Badge variant="outline" className="text-[10px]">{li.badge}</Badge> : null}
                  </div>
                </td>
                <td className="py-2 text-xs text-slate-500">{li.description}</td>
                <td className="py-2 text-right">
                  <Input
                    type="number"
                    className="h-8 w-20 ml-auto text-right"
                    value={li.qty}
                    onChange={(e) => onQtyChange(li.id, Math.max(1, Number(e.target.value) || 1))}
                  />
                </td>
                <td className="py-2 text-right">{formatINR(li.unitPrice)}</td>
                <td className="py-2 text-right">{(li.discountRate * 100).toFixed(1)}%</td>
                <td className="py-2 text-right">{(li.taxRate * 100).toFixed(0)}%</td>
                <td className="py-2 text-right font-medium">{formatINR(lineTotal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
