'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PAYAID_MODULES } from '@/lib/config/payaid-modules.config'
import { useAuthStore } from '@/lib/stores/auth'
import { useToast } from '@/components/ui/use-toast'
import { LayoutGrid, ShieldAlert, Sparkles } from 'lucide-react'

type TenantModuleItem = {
  id: string
  name: string
  description: string
  category?: string
  enabled: boolean
  enabled_by_default?: boolean
}

export default function ModulesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { token } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'modules', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tenants/${encodeURIComponent(tenantId)}/modules`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = new Error(json.error || 'Failed to load modules') as Error & { status?: number }
        err.status = res.status
        throw err
      }
      return json as {
        enabled_modules: string[]
        available_modules: TenantModuleItem[]
        subscription_tier?: string
      }
    },
    enabled: Boolean(tenantId && token),
    retry: false,
  })

  const isReadOnly = (error as any)?.status === 403

  const availableModules: TenantModuleItem[] = useMemo(() => {
    if (data?.available_modules?.length) return data.available_modules

    // Fallback: show app registry modules in a read-only manner.
    const enabled = new Set<string>()
    return PAYAID_MODULES
      .filter((m) => m.id !== 'home')
      .map((m) => ({
        id: m.id,
        name: m.label,
        description: m.description,
        category: m.tier,
        enabled: enabled.has(m.id),
      }))
  }, [data])

  const enabledCount = useMemo(() => availableModules.filter((m) => m.enabled).length, [availableModules])

  const toggleModule = useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/tenants/${encodeURIComponent(tenantId)}/modules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ moduleId, enabled }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to update module')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'modules', tenantId] })
      toast({ title: 'Modules updated' })
    },
    onError: (e) => {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Unable to update modules', variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Modules</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Enable or disable modules for this workspace</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {enabledCount} enabled
          </Badge>
          {data?.subscription_tier && (
            <Badge variant="outline" className="rounded-full">
              Tier: {String(data.subscription_tier)}
            </Badge>
          )}
        </div>
        <Button variant="outline" asChild>
          <a href={`/home/${tenantId}`}>Back to apps</a>
        </Button>
      </div>

      {isReadOnly && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <div className="mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">Read-only</div>
            <div className="text-amber-700/90 dark:text-amber-200/80">
              Module licensing is restricted. Ask a Super Admin to change enabled modules for this workspace.
            </div>
          </div>
        </div>
      )}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <LayoutGrid className="w-5 h-5" />
            Module management
          </CardTitle>
          <CardDescription>Turn modules on or off based on your plan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : error && !isReadOnly ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {(error as Error).message || 'Failed to load modules'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableModules.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-[1px] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{m.name}</div>
                        {m.id.startsWith('ai') && <Sparkles className="w-4 h-4 text-indigo-500" />}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {m.description}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={m.enabled ? 'default' : 'secondary'} className="rounded-full">
                          {m.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {m.enabled_by_default && (
                          <Badge variant="outline" className="rounded-full">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={m.enabled}
                      disabled={isReadOnly || toggleModule.isPending}
                      onCheckedChange={(checked) => toggleModule.mutate({ moduleId: m.id, enabled: checked })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
