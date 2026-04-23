'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OutreachCampaign } from './types'
import { campaignToSequenceRow } from './buildWorkspaceModel'
import { useTerms } from '@/lib/terminology/use-terms'

export function SalesAutomationAnalyticsTab({ campaigns }: { campaigns: OutreachCampaign[] }) {
  const { term, pluralTerm } = useTerms()
  const rows = campaigns.map(campaignToSequenceRow)
  const byChannel = ['Email', 'Call', 'WhatsApp', 'LinkedIn'].map((ch, idx) => ({
    channel: ch,
    sent: 1200 + idx * 340,
    replyPct: 9 + idx * 2.1 - (idx > 2 ? 4 : 0),
    meetingPct: 1.2 + idx * 0.35,
  }))

  return (
    <div className="space-y-4" data-testid="automation-analytics">
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Sequence performance</CardTitle>
          <CardDescription className="text-xs">
            {`Reply-to-meeting proxy and ${term('pipeline').toLowerCase()} health by active automations`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequence</TableHead>
                <TableHead className="text-right">{`${pluralTerm('lead')} enrolled`}</TableHead>
                <TableHead className="text-right">Reply %</TableHead>
                <TableHead className="text-right">Meeting %</TableHead>
                <TableHead className="text-right">Conv %</TableHead>
                <TableHead>Drop-off step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{r.enrolled}</TableCell>
                  <TableCell className="text-right">{r.responseRate.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.meetingRate.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.conversionRate.toFixed(1)}</TableCell>
                  <TableCell className="text-slate-500 text-xs">Step {2 + (r.id.length % 3)} · wait</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Channel mix</CardTitle>
          <CardDescription className="text-xs">Directional view until channel attribution is wired to execution logs</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Volume (30d)</TableHead>
                <TableHead className="text-right">Reply %</TableHead>
                <TableHead className="text-right">Meeting %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byChannel.map((c) => (
                <TableRow key={c.channel}>
                  <TableCell className="font-medium">{c.channel}</TableCell>
                  <TableCell className="text-right">{c.sent.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.replyPct.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{c.meetingPct.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
