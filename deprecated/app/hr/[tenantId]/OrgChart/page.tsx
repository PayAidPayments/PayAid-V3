'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, User, Building2, Briefcase, Loader2 } from 'lucide-react'
import type { OrgChartNode } from '@/app/api/hr/org-chart/route'

function OrgChartCard({ node, depth = 0, tenantId }: { node: OrgChartNode; depth?: number; tenantId: string }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
        style={{ marginLeft: depth * 24 }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
          ) : (
            <span className="w-4" />
          )}
        </button>
        <Link
          href={`/hr/${tenantId}/Employees/${node.id}`}
          className="flex flex-1 min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{node.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              {node.designation && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <Briefcase className="h-3 w-3" />
                  {node.designation}
                </span>
              )}
              {node.department && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <Building2 className="h-3 w-3" />
                  {node.department}
                </span>
              )}
              <Badge variant="secondary" className="text-xs font-mono">
                {node.employeeCode}
              </Badge>
            </div>
          </div>
        </Link>
      </div>
      {open && hasChildren && (
        <div className="flex flex-col gap-1 mt-1">
          {node.children.map((child) => (
            <OrgChartCard key={child.id} node={child} depth={depth + 1} tenantId={tenantId} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HROrgChartPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const token = useAuthStore((s) => s.token)
  const [tree, setTree] = useState<OrgChartNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) return
    setLoading(true)
    setError(null)
    fetch(`/api/hr/org-chart?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Unauthorized' : 'Failed to load org chart')
        return r.json()
      })
      .then((data) => setTree(data.tree ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [tenantId, token])

  return (
    <div className="space-y-6">
      <UniversalModuleHero
        title="Org Chart"
        subtitle="Visual hierarchy of your company — built from employee and manager data."
      />
      {loading && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading org chart…</span>
        </Card>
      )}
      {error && (
        <Card className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-6">
          <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </Card>
      )}
      {!loading && !error && tree.length === 0 && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No reporting structure yet. Add employees and set their manager in Employee records to see the org chart.
          </p>
        </Card>
      )}
      {!loading && !error && tree.length > 0 && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <CardContent className="p-4 space-y-1">
            {tree.map((node) => (
              <OrgChartCard key={node.id} node={node} tenantId={tenantId} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
