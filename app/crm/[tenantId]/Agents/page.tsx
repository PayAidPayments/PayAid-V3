'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, MessageCircle, FileCheck, Utensils, Truck, Loader2, Play, CheckCircle, XCircle } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

const AGENTS = [
  {
    id: 'retail-inventory',
    name: 'Retail Inventory Agent',
    description: 'Low stock alert → sales analysis → reorder list + WhatsApp supplier message. Shiprocket delivery (₹).',
    icon: Package,
    apiPath: '/api/agents/retail-inventory',
    status: 'live' as const,
  },
  {
    id: 'services-lead-followup',
    name: 'Services Lead Follow-up',
    description: 'Lead score >70 + no reply 48h → WhatsApp nudge → email → call script.',
    icon: MessageCircle,
    apiPath: '/api/agents/services-lead-followup',
    status: 'coming_soon' as const,
  },
  {
    id: 'manufacturing-gst',
    name: 'Manufacturing GST Compliance',
    description: 'Monthly: pull invoices → validate GSTIN → e-invoice → GSTR-1. Output in ₹.',
    icon: FileCheck,
    apiPath: '/api/agents/manufacturing-gst',
    status: 'coming_soon' as const,
  },
  {
    id: 'fb-revenue',
    name: 'F&B Revenue Optimizer',
    description: 'Weekly sales dip → menu performance → price/promos → Swiggy/Zomato listings.',
    icon: Utensils,
    apiPath: '/api/agents/fb-revenue',
    status: 'coming_soon' as const,
  },
  {
    id: 'ecom-shiprocket',
    name: 'Ecom Shiprocket Optimizer',
    description: 'Order batch >10 → optimal courier → bulk labels → tracking dashboard.',
    icon: Truck,
    apiPath: '/api/agents/ecom-shiprocket',
    status: 'coming_soon' as const,
  },
]

export default function AgentsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()
  const [runningId, setRunningId] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<Record<string, { ok: boolean; message?: string; data?: unknown }>>({})

  const runAgent = useMutation({
    mutationFn: async (agentId: string) => {
      const agent = AGENTS.find((a) => a.id === agentId)
      if (!agent) throw new Error('Unknown agent')
      const res = await apiRequest(agent.apiPath, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      return { agentId, ok: res.ok, data, status: res.status }
    },
    onMutate: (agentId) => setRunningId(agentId),
    onSettled: (_, __, agentId) => setRunningId(null),
    onSuccess: (result) => {
      setLastResult((prev) => ({
        ...prev,
        [result.agentId]: {
          ok: result.ok,
          message: result.ok ? 'Run completed' : (result.data as { error?: string })?.error || 'Run failed',
          data: result.data,
        },
      }))
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })

  if (!tenantId) return <PageLoading message="Loading..." fullScreen={false} />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Industry Agents</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Run pre-built workflows. India SMB only. All amounts in ₹ INR.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AGENTS.map((agent) => {
          const Icon = agent.icon
          const isRunning = runningId === agent.id
          const result = lastResult[agent.id]
          const isLive = agent.status === 'live'

          return (
            <Card key={agent.id} className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  <Badge variant={isLive ? 'default' : 'secondary'}>
                    {isLive ? 'Live' : 'Coming soon'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {result && (
                  <div className={`mb-3 text-sm flex items-center gap-2 ${result.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {result.message}
                    {result.ok && result.data && typeof result.data === 'object' && 'summaryMessage' in result.data && (
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        — {(result.data as { summaryMessage?: string }).summaryMessage}
                      </span>
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  disabled={!isLive || isRunning}
                  onClick={() => runAgent.mutate(agent.id)}
                >
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span className="ml-2">{isLive ? 'Run' : 'Coming soon'}</span>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
