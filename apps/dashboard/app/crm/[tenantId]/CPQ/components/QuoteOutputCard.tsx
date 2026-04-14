import { Download, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function QuoteOutputCard() {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Document Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <p>Template: Standard Enterprise Quote v2</p>
        <p>Language: English (India)</p>
        <p>E-sign: Ready</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> PDF</Button>
          <Button size="sm" variant="outline"><Send className="w-4 h-4 mr-1" /> Web Quote</Button>
        </div>
      </CardContent>
    </Card>
  )
}
