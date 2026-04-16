'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { format } from 'date-fns'
import { Calendar, CheckCircle2, Clock3, FileText, Link2, User } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import type { ActivityItem } from './types'
import { useParams, useRouter } from 'next/navigation'
import { useUpdateTask } from '@/lib/hooks/use-api'

interface ActivityDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityItem | null
}

const getCompanyName = (company: string | { name?: string } | null | undefined) => {
  if (!company) return null
  if (typeof company === 'string') return company
  return company.name || null
}

export default function ActivityDetailDrawer({
  open,
  onOpenChange,
  activity,
}: ActivityDetailDrawerProps) {
  const params = useParams()
  const router = useRouter()
  const updateTask = useUpdateTask()
  const tenantIdParam = params?.tenantId
  const tenantId = Array.isArray(tenantIdParam) ? (tenantIdParam[0] || '') : ((tenantIdParam as string) || '')

  if (!activity) return null

  const companyName = getCompanyName(activity.contact?.company)
  const entityId = activity.id.includes('_') ? activity.id.split('_').slice(1).join('_') : activity.id

  const handleMarkDone = () => {
    if (activity.type === 'task') {
      updateTask.mutate(
        {
          id: entityId,
          data: { status: 'completed' },
        },
        {
          onSuccess: () => onOpenChange(false),
        }
      )
      return
    }
    if (tenantId) {
      router.push(`/crm/${tenantId}/Activities`)
      onOpenChange(false)
    }
  }

  const handleScheduleFollowUp = () => {
    if (!tenantId) return
    const params = new URLSearchParams()
    if (activity.contact?.id) params.set('contactId', activity.contact.id)
    params.set('title', `Follow up: ${activity.title}`)
    if (activity.metadata?.dueDate) params.set('dueDate', activity.metadata.dueDate)
    params.set('priority', 'high')
    router.push(`/crm/${tenantId}/Tasks/new?${params.toString()}`)
    onOpenChange(false)
  }

  const handleAISummary = () => {
    window.dispatchEvent(new CustomEvent('open-page-ai'))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto" data-testid="activity-detail-drawer">
        <SheetHeader>
          <SheetTitle className="pr-8">{activity.title}</SheetTitle>
          <SheetDescription>
            Detailed context, linked records, and recommended next actions.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Activity context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="uppercase">{activity.type}</Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
              <p>{activity.description || 'No additional activity description was captured.'}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <div className="inline-flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  {activity.contact?.name || activity.contact?.email || 'No contact linked'}
                </div>
                <div className="inline-flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-slate-500" />
                  {companyName || 'No company linked'}
                </div>
                <div className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                  Outcome: {activity.metadata?.outcome || activity.status || 'Pending'}
                </div>
                <div className="inline-flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Due: {activity.metadata?.dueDate ? format(new Date(activity.metadata.dueDate), 'dd MMM yyyy') : 'Not set'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Linked records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>Deal stage: {activity.metadata?.stage || 'Not linked'}</p>
              <p>Deal value: {activity.metadata?.value ? formatINRForDisplay(activity.metadata.value) : 'Not available'}</p>
              <p>Owner: {activity.metadata?.owner || activity.metadata?.assignedToId || 'Unassigned'}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Transcript / message / notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
                {activity.description || 'Message body is loaded on demand for performance. Open full thread to fetch details.'}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Next step editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">Purpose: {activity.metadata?.purpose || 'Follow-up'}</div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">Next step: {activity.metadata?.nextStep || 'Call back in 24 hours'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="inline-flex items-center gap-1.5"
                  onClick={handleMarkDone}
                  disabled={updateTask.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {updateTask.isPending ? 'Saving...' : 'Mark done'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-1.5"
                  onClick={handleScheduleFollowUp}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule follow-up
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-1.5"
                  onClick={handleAISummary}
                >
                  <FileText className="h-3.5 w-3.5" />
                  AI summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
