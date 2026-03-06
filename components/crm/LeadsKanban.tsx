'use client'

import { useMemo, useCallback, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { StageBadge } from '@/components/crm/StageBadge'
import { format } from 'date-fns'
import { GripVertical, Loader2 } from 'lucide-react'

const STAGES = [
  { id: 'prospect', label: 'Prospect', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  { id: 'contact', label: 'Contact', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
  { id: 'customer', label: 'Customer', color: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
] as const

type StageId = (typeof STAGES)[number]['id']

interface LeadCardProps {
  lead: {
    id: string
    name: string
    company?: string | null
    email?: string | null
    phone?: string | null
    stage?: string | null
    leadScore?: number | null
    lastContactedAt?: string | null
    createdAt?: string
  }
  tenantId: string
  isDragOverlay?: boolean
}

function DraggableLeadCard({ lead, tenantId }: LeadCardProps) {
  const stage = (lead.stage || 'prospect') as StageId
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-50' : ''}>
      <Card className="mb-2 cursor-grab active:cursor-grabbing border">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-slate-400 dark:text-gray-500 cursor-grab">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/crm/${tenantId}/Contacts/${lead.id}`}
                className="font-medium text-slate-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.name}
              </Link>
              {lead.company && (
                <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">{lead.company}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {lead.leadScore != null && <LeadScoringBadge score={lead.leadScore} />}
                <StageBadge stage={stage} />
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                {lead.lastContactedAt ? format(new Date(lead.lastContactedAt), 'MMM d') : lead.createdAt ? format(new Date(lead.createdAt), 'MMM d') : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeadCard({ lead, tenantId, isDragOverlay }: LeadCardProps) {
  const stage = (lead.stage || 'prospect') as StageId
  return (
    <Card className={`mb-2 border ${isDragOverlay ? 'shadow-xl ring-2 ring-indigo-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {!isDragOverlay && (
            <div className="mt-0.5 text-slate-400 dark:text-gray-500">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              href={`/crm/${tenantId}/Contacts/${lead.id}`}
              className="font-medium text-slate-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1"
              onClick={(e) => isDragOverlay && e.preventDefault()}
            >
              {lead.name}
            </Link>
            {lead.company && (
              <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">{lead.company}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.leadScore != null && <LeadScoringBadge score={lead.leadScore} />}
              <StageBadge stage={stage} />
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
              {lead.lastContactedAt ? format(new Date(lead.lastContactedAt), 'MMM d') : lead.createdAt ? format(new Date(lead.createdAt), 'MMM d') : '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface LeadsKanbanProps {
  tenantId: string
}

export function LeadsKanban({ tenantId }: LeadsKanbanProps) {
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', 'kanban', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?limit=500&tenantId=${encodeURIComponent(tenantId)}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch contacts')
      const json = await res.json()
      return json.contacts as Array<{ id: string; name: string; company?: string | null; email?: string | null; phone?: string | null; stage?: string | null; leadScore?: number | null; lastContactedAt?: string | null; createdAt?: string }>
    },
  })

  const updateStage = useMutation({
    mutationFn: async ({ contactId, stage }: { contactId: string; stage: StageId }) => {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update stage')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'kanban', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const contactsByStage = useMemo(() => {
    const list = data || []
    const map: Record<StageId, typeof list> = { prospect: [], contact: [], customer: [] }
    for (const c of list) {
      const stage = (c.stage || 'prospect') as StageId
      if (map[stage]) map[stage].push(c)
      else map.prospect.push(c)
    }
    return map
  }, [data])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const contactId = String(event.active.id)
      const overId = event.over?.id
      if (overId == null) return
      const targetStage = STAGES.find((s) => s.id === String(overId))
      if (!targetStage) return
      const contact = data?.find((c) => c.id === contactId)
      if (!contact || (contact.stage || 'prospect') === targetStage.id) return
      updateStage.mutate({ contactId, stage: targetStage.id })
    },
    [data, updateStage]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeLead = activeId ? data?.find((c) => c.id === activeId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={contactsByStage[stage.id]}
            tenantId={tenantId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-2 scale-105">
            <LeadCard lead={activeLead} tenantId={tenantId} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  stage,
  leads,
  tenantId,
}: {
  stage: (typeof STAGES)[number]
  leads: Array<{ id: string; name: string; company?: string | null; stage?: string | null; leadScore?: number | null; lastContactedAt?: string | null; createdAt?: string }>
  tenantId: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed ${stage.color} p-3 min-h-[320px] transition-colors ${isOver ? 'ring-2 ring-indigo-400' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-gray-200">{stage.label}</h3>
        <span className="text-sm text-slate-500 dark:text-gray-400">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} tenantId={tenantId} />
        ))}
      </div>
    </div>
  )
}
