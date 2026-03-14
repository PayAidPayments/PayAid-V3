'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { useToast } from '@/components/ui/use-toast'
import { Shield, UserPlus, GitBranch, Loader2 } from 'lucide-react'

type Role = {
  id: string
  roleName: string
  description: string | null
  roleType: string
  permissions: string[]
  isSystem: boolean
  isActive: boolean
  _count?: { userRoles: number }
}

export default function SettingsRolesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<'custom' | 'manager' | 'user'>('custom')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['settings', 'roles', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/roles', { headers: getAuthHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to load roles')
      return json as { roles: Role[] }
    },
    enabled: !!tenantId,
  })

  const { data: permsData } = useQuery({
    queryKey: ['settings', 'permissions', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/permissions', { headers: getAuthHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return { permissions: [] }
      return json as { permissions: { id: string; permissionCode: string; description?: string }[] }
    },
    enabled: !!tenantId && createOpen,
  })

  const createRole = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          roleName: newName.trim(),
          description: newDesc.trim() || undefined,
          roleType: newType,
          permissions: selectedPerms,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to create role')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles', tenantId] })
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
      setSelectedPerms([])
      toast({ title: 'Role created', description: 'Custom role is ready. Assign it to users from Users.' })
    },
    onError: (e) => {
      toast({ title: 'Failed to create role', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' })
    },
  })

  const roles = rolesData?.roles ?? []
  const permissions = permsData?.permissions ?? []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Pre-built and custom roles. Assign roles to users under Users. Run the seed SQL in Supabase to add HR permissions.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </CardTitle>
            <CardDescription>Admin, Payroll Manager, Approver, Viewer and custom roles</CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Create role
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500 py-4">Loading roles…</p>
          ) : roles.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">No roles yet.</p>
              <p className="text-xs text-slate-500 mt-1">Run the seed SQL in Supabase or create a custom role.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                Create role
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {roles.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{r.roleName}</span>
                    {r.description && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{r.description}</span>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{r.roleType}</Badge>
                      {r.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                      {r._count?.userRoles != null && (
                        <span className="text-xs text-slate-500">{r._count.userRoles} user(s)</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Workflows
          </CardTitle>
          <CardDescription>
            Reimbursement → Manager → Finance; Payroll adjustment → Payroll Manager → CEO. Workflow builder coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Configure approval chains in a future release. For now, approvals use default routing (e.g. Reimbursements and Leave).
          </p>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Create custom role</DialogTitle>
            <DialogDescription>Name and permissions. You can edit later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Role name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Payroll Approver"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'custom' | 'manager' | 'user')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="custom">Custom</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded border border-slate-200 dark:border-slate-700 p-2">
                {permissions.length === 0 ? (
                  <p className="text-xs text-slate-500">Run the roles/permissions seed SQL in Supabase to see permissions.</p>
                ) : (
                  permissions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(p.permissionCode)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPerms((s) => [...s, p.permissionCode])
                          else setSelectedPerms((s) => s.filter((x) => x !== p.permissionCode))
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{p.permissionCode}</span>
                      {p.description && (
                        <span className="text-xs text-slate-500">— {p.description}</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createRole.mutate()}
              disabled={!newName.trim() || createRole.isPending}
            >
              {createRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

