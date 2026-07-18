'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IndianRupee, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CampaignDetailPayload } from '@/lib/marketing/campaign-detail-payload'

function fmtInr(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function CampaignSpendPanel({
  tenantId,
  campaignId,
  payload,
}: {
  tenantId: string
  campaignId: string
  payload: CampaignDetailPayload
}) {
  const queryClient = useQueryClient()
  const { campaign } = payload
  const [budgetInr, setBudgetInr] = useState(campaign.budgetInr != null ? String(campaign.budgetInr) : '')
  const [spendInr, setSpendInr] = useState(String(campaign.spendInr ?? 0))
  const [hardCap, setHardCap] = useState(campaign.hardCap)

  useEffect(() => {
    setBudgetInr(campaign.budgetInr != null ? String(campaign.budgetInr) : '')
    setSpendInr(String(campaign.spendInr ?? 0))
    setHardCap(campaign.hardCap)
  }, [campaign.budgetInr, campaign.spendInr, campaign.hardCap])

  const saveSpend = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetInr: budgetInr.trim() === '' ? null : Math.max(0, parseInt(budgetInr, 10) || 0),
          spendInr: Math.max(0, parseInt(spendInr, 10) || 0),
          hardCap,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to save spend')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', tenantId] })
    },
  })

  const budgetNum = budgetInr.trim() === '' ? null : parseInt(budgetInr, 10) || 0
  const spendNum = parseInt(spendInr, 10) || 0
  const remaining = budgetNum != null ? Math.max(0, budgetNum - spendNum) : null

  return (
    <Card data-testid="campaign-spend-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-violet-600" />
          Spend & budget
        </CardTitle>
        <CardDescription>
          Track actual spend for ROAS on Marketing Home. Budget caps block sends when hard cap is enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-budget">Budget (₹)</Label>
            <Input
              id="campaign-budget"
              type="number"
              min={0}
              placeholder="Optional"
              value={budgetInr}
              onChange={(e) => setBudgetInr(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-spend">Spend to date (₹)</Label>
            <Input
              id="campaign-spend"
              type="number"
              min={0}
              value={spendInr}
              onChange={(e) => setSpendInr(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Switch id="campaign-hard-cap" checked={hardCap} onCheckedChange={setHardCap} />
            <Label htmlFor="campaign-hard-cap" className="font-normal cursor-pointer">
              Enforce hard budget cap
            </Label>
          </div>
          {remaining != null && (
            <span>
              Remaining: <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtInr(remaining)}</span>
            </span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => saveSpend.mutate()}
          disabled={saveSpend.isPending}
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saveSpend.isPending ? 'Saving…' : 'Save spend'}
        </Button>
        {saveSpend.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {saveSpend.error instanceof Error ? saveSpend.error.message : 'Save failed'}
          </p>
        )}
        {saveSpend.isSuccess && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Spend updated — ROAS will refresh on Marketing Home.</p>
        )}
      </CardContent>
    </Card>
  )
}
