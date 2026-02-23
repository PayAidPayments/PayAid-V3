'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useAuthStore } from '@/lib/stores/auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const TYPES = ['SALARY_REVIEW', 'ROLE_CHANGE', 'RETENTION_BONUS', 'ONE_ON_ONE', 'PIP', 'PROMOTION', 'OTHER'] as const
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'] as const

interface Intervention {
  id: string
  type: string
  status: string
  suggestedAction: string | null
  costEstimateInr: number | null
  roiEstimate: number | null
  notes: string | null
  completedAt: string | null
  createdAt: string
}

interface RetentionInterventionsCardProps {
  employeeId: string
  tenantId: string
}

export function RetentionInterventionsCard({ employeeId, tenantId }: RetentionInterventionsCardProps) {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<string>('ONE_ON_ONE')
  const [formStatus, setFormStatus] = useState<string>('PENDING')
  const [formNotes, setFormNotes] = useState('')
  const [formCost, setFormCost] = useState('')
  const [formRoi, setFormRoi] = useState('')

  const { data: interventions = [], isLoading } = useQuery<Intervention[]>({
    queryKey: ['retention-interventions', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/employees/${employeeId}/retention-interventions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch interventions')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (body: { type: string; status: string; notes?: string; costEstimateInr?: number; roiEstimate?: number }) => {
      const res = await fetch(`/api/hr/employees/${employeeId}/retention-interventions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create intervention')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention-interventions', employeeId] })
      setShowForm(false)
      setFormNotes('')
      setFormCost('')
      setFormRoi('')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'DEFERRED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      type: formType,
      status: formStatus,
      notes: formNotes || undefined,
      costEstimateInr: formCost ? Number(formCost) : undefined,
      roiEstimate: formRoi ? Number(formRoi) : undefined,
    })
  }

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="animate-pulse">Loading retention actions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Briefcase className="h-5 w-5" />
              Retention Actions
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Track salary reviews, one-on-ones, and other retention interventions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="dark:border-gray-600 dark:text-gray-300"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add action
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-600"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Cost estimate ₹ (optional)</Label>
                <Input
                  type="number"
                  value={formCost}
                  onChange={(e) => setFormCost(e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-600"
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <Label className="text-sm">ROI estimate (optional)</Label>
                <Input
                  type="number"
                  value={formRoi}
                  onChange={(e) => setFormRoi(e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-600"
                  placeholder="e.g. 500 for 5x"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {interventions.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground dark:text-gray-400">No retention actions yet. Add one to track salary reviews, one-on-ones, or retention bonuses.</p>
        ) : (
          <ul className="space-y-2">
            {interventions.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border dark:border-gray-700"
              >
                <div>
                  <span className="font-medium dark:text-gray-100">{i.type.replace(/_/g, ' ')}</span>
                  <Badge className={getStatusColor(i.status) + ' ml-2'}>{i.status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">
                  {i.costEstimateInr != null && <span className="mr-3">{formatINRForDisplay(i.costEstimateInr)}</span>}
                  {i.roiEstimate != null && <span className="mr-3">{i.roiEstimate}x ROI</span>}
                  {format(new Date(i.createdAt), 'MMM d, yyyy')}
                </div>
                {i.notes && <p className="text-xs text-muted-foreground w-full mt-1">{i.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
