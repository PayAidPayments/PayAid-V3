import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Quote } from './types'

type ApprovalStatusCardProps = {
  selectedQuote: Quote | null
  approvalRequired: boolean
  approvalReason: string
  approvalNote: string
  rejectReason: string
  onApprovalNoteChange: (value: string) => void
  onRejectReasonChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  onConvert: () => void
  isApproving: boolean
  isConverting: boolean
}

export function ApprovalStatusCard({
  selectedQuote,
  approvalRequired,
  approvalReason,
  approvalNote,
  rejectReason,
  onApprovalNoteChange,
  onRejectReasonChange,
  onApprove,
  onReject,
  onConvert,
  isApproving,
  isConverting,
}: ApprovalStatusCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-approval-status">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Approval Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2">
          <p className="text-xs text-slate-500">State</p>
          <p className="font-medium">{approvalRequired ? 'Approval Required' : 'No Approval Required'}</p>
          <p className="text-xs text-slate-500">{approvalRequired ? approvalReason : 'Auto-clear for sending'}</p>
        </div>
        <Input
          placeholder="Approver note"
          value={approvalNote}
          onChange={(e) => onApprovalNoteChange(e.target.value)}
        />
        <Input
          placeholder="Rejection reason"
          value={rejectReason}
          onChange={(e) => onRejectReasonChange(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" disabled={!selectedQuote || isApproving} onClick={onApprove}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" disabled={!selectedQuote || isApproving} onClick={onReject}>
            Reject
          </Button>
          <Button size="sm" variant="outline" className="col-span-2" disabled={!selectedQuote || isConverting} onClick={onConvert}>
            Convert to Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
