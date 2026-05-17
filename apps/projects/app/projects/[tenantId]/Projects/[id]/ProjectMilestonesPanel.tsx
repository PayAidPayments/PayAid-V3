'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAuthHeaders } from '@/lib/api/client'
import {
  canApproveMilestoneBilling,
  canMarkMilestoneMet,
  milestoneBillingStatusLabel,
  milestoneEligibleForBillingHandoff,
  type MilestoneBillingRow,
} from '@/lib/projects/milestone-billing-ui'
import {
  financeInvoiceEditUrl,
  financeInvoiceNewFromMilestoneUrl,
} from '../../projects-canonical-links'
import { ExternalLink, Receipt } from 'lucide-react'

export type ProjectMilestoneDto = MilestoneBillingRow & {
  dueDate?: string | null
  approvalChecklistTaskExists?: boolean
}

type ProjectMilestonesPanelProps = {
  tenantId: string
  projectId: string
  projectName: string
  clientId?: string | null
  milestones: ProjectMilestoneDto[]
}

async function parseJsonError(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}))
  throw new Error((body as { error?: string }).error || fallback)
}

export function ProjectMilestonesPanel({
  tenantId,
  projectId,
  projectName,
  clientId,
  milestones,
}: ProjectMilestonesPanelProps) {
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] })
  }

  const patchMilestone = async (milestoneId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) await parseJsonError(res, 'Failed to update milestone')
    return res.json() as {
      billingHandoff?: { invoiceDraftId?: string; milestoneName?: string }
    }
  }

  const markMet = async (m: ProjectMilestoneDto) => {
    setBusyId(m.id)
    setMessage(null)
    try {
      const data = await patchMilestone(m.id, { status: 'MET' })
      if (data.billingHandoff?.invoiceDraftId) {
        setMessage(
          `Draft invoice created for "${m.name}". Open it in Finance to review and send.`
        )
      } else {
        setMessage(`Milestone "${m.name}" marked Met.`)
      }
      invalidate()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const approveBilling = async (m: ProjectMilestoneDto) => {
    setBusyId(m.id)
    setMessage(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${m.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!res.ok) await parseJsonError(res, 'Failed to approve milestone for billing')
      const data = (await res.json()) as { billingHandoff?: { invoiceDraftId?: string } }
      if (data.billingHandoff?.invoiceDraftId) {
        setMessage(`Billing approved — draft invoice ready for "${m.name}".`)
      } else {
        setMessage(`Billing approved for "${m.name}".`)
      }
      invalidate()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setBusyId(null)
    }
  }

  const createDraftHandoff = async (m: ProjectMilestoneDto) => {
    setBusyId(m.id)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/milestones/${m.id}/billing-handoff`,
        { method: 'POST', headers: getAuthHeaders() }
      )
      if (!res.ok) await parseJsonError(res, 'Failed to create invoice draft')
      const data = (await res.json()) as {
        billingHandoff?: { invoiceDraftId?: string }
        financeLicensed?: boolean
      }
      if (data.billingHandoff?.invoiceDraftId) {
        setMessage(`Draft invoice created for "${m.name}".`)
      } else if (data.financeLicensed === false) {
        setMessage('Finance module not licensed — use manual invoice link below.')
      } else {
        setMessage('Handoff recorded. Open Finance to complete the invoice if no draft was created.')
      }
      invalidate()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Handoff failed')
    } finally {
      setBusyId(null)
    }
  }

  if (!milestones.length) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Billing milestones</CardTitle>
          <CardDescription className="dark:text-gray-400">
            No milestones on this project yet. Seed a service playbook at create time to add milestones.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-gray-100 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing milestones
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Mark milestones Met, approve bill-on-approve gates, then open Finance drafts. Draft-first — review
          before sending.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p className="text-sm rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-purple-900 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-100">
            {message}
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="dark:text-gray-300">Milestone</TableHead>
              <TableHead className="dark:text-gray-300">Due</TableHead>
              <TableHead className="dark:text-gray-300">Status</TableHead>
              <TableHead className="dark:text-gray-300">Billing</TableHead>
              <TableHead className="dark:text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones.map((m) => {
              const eligible = milestoneEligibleForBillingHandoff(m, { id: projectId, name: projectName })
              const draftId = m.billingDraftInvoiceId
              const isBusy = busyId === m.id

              return (
                <TableRow key={m.id} className="dark:border-gray-700">
                  <TableCell className="font-medium dark:text-gray-100">{m.name}</TableCell>
                  <TableCell className="text-sm dark:text-gray-400">
                    {m.dueDate ? format(new Date(m.dueDate), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                      {(m.status || 'PENDING').replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm dark:text-gray-400">
                    <div>{milestoneBillingStatusLabel(m)}</div>
                    <div className="text-xs mt-0.5 text-gray-500">
                      Trigger: {(m.billingTrigger || 'NONE').replace('_', ' ')}
                      {m.approvalRequired ? ' · approval required' : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {canMarkMilestoneMet(m) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => markMet(m)}
                        className="dark:border-gray-600"
                      >
                        Mark Met
                      </Button>
                    ) : null}
                    {canApproveMilestoneBilling(m) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => approveBilling(m)}
                        className="dark:border-gray-600"
                      >
                        Approve billing
                      </Button>
                    ) : null}
                    {draftId ? (
                      <a href={financeInvoiceEditUrl(tenantId, draftId)} target="_blank" rel="noopener noreferrer">
                        <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Open draft
                        </Button>
                      </a>
                    ) : eligible ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => createDraftHandoff(m)}
                          className="dark:bg-gray-700 dark:text-gray-100"
                        >
                          Create draft
                        </Button>
                        {clientId ? (
                          <a
                            href={financeInvoiceNewFromMilestoneUrl(tenantId, {
                              customerId: clientId,
                              projectId,
                              milestoneId: m.id,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button type="button" size="sm" variant="ghost" className="dark:text-gray-300">
                              Finance manual
                            </Button>
                          </a>
                        ) : null}
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
