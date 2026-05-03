import { Download, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type QuoteOutputCardProps = {
  disabled?: boolean
  isDocumentBusy?: boolean
  documentMessage?: string | null
  onPdf?: () => void
  onWeb?: () => void
}

export function QuoteOutputCard({
  disabled,
  isDocumentBusy,
  documentMessage,
  onPdf,
  onWeb,
}: QuoteOutputCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-quote-output">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Document output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <p>Template: Standard Enterprise Quote v2</p>
        <p>Language: English (India)</p>
        <p>E-sign: Ready</p>
        {documentMessage ? (
          <p className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-1.5 text-slate-700 dark:text-slate-200">
            {documentMessage}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={disabled || isDocumentBusy}
            title="Record PDF issuance (demo); connect renderer for binary download"
            onClick={onPdf}
          >
            {isDocumentBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={disabled || isDocumentBusy}
            title="Record web quote link (demo); connect portal URL in production"
            onClick={onWeb}
          >
            {isDocumentBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Web quote
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
