'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDeals, useUpdateDeal } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ModuleGate } from '@/components/modules/ModuleGate'
import { BackToApps } from '@/components/BackToApps'

const stages = [
  { id: 'lead', name: 'Lead', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
  { id: 'qualified', name: 'Qualified', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  { id: 'proposal', name: 'Proposal', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
  { id: 'won', name: 'Won', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
  { id: 'lost', name: 'Lost', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
]

function DealsPageContent() {
  const { data, isLoading } = useDeals()
  const updateDeal = useUpdateDeal()
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)

  const deals = data?.deals || []
  const pipelineSummary = data?.pipelineSummary || []

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (!draggedDeal) return

    try {
      await updateDeal.mutateAsync({
        id: draggedDeal,
        data: { stage: targetStage },
      })
      setDraggedDeal(null)
    } catch (error) {
      console.error('Failed to update deal:', error)
    }
  }

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal: any) => deal.stage === stage)
  }

  const getStageTotal = (stage: string) => {
    const summary = pipelineSummary.find((s: any) => s.stage === stage)
    return summary?._sum?.value || 0
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-900 dark:text-gray-100">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackToApps />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deals Pipeline</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your sales pipeline</p>
          </div>
        </div>
        <Link href="/dashboard/deals/new">
          <Button>New Deal</Button>
        </Link>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const count = getDealsByStage(stage.id).length
          const total = getStageTotal(stage.id)
          return (
            <Card key={stage.id}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stage.name}</div>
                  {total > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ₹{total.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getDealsByStage(stage.id).length}
              </span>
            </div>

            <div className="space-y-3">
              {getDealsByStage(stage.id).map((deal: any) => (
                <Link
                  key={deal.id}
                  href={`/dashboard/deals/${deal.id}`}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">{deal.name}</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                        ₹{deal.value.toLocaleString('en-IN')}
                      </div>
                      {deal.contact && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {deal.contact.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {deal.probability}% probability
                        </div>
                        {deal.expectedCloseDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(deal.expectedCloseDate), 'MMM dd')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {getDealsByStage(stage.id).length === 0 && (
                <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DealsPage() {
  return (
    <ModuleGate module="crm">
      <DealsPageContent />
    </ModuleGate>
  )
}
