'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { useToast } from '@/components/ui/use-toast'
import { Users as UsersIcon, UserPlus, Trash2, RefreshCcw } from 'lucide-react'

type TenantUser = {
  id: string
  email: string
  name: string | null
  role: string
  lastLoginAt: string | null
  createdAt: string
}

export default function UsersPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [showLastLogin, setShowLastLogin] = useState(true)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['settings', 'users', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', { headers: getAuthHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to load users')
      return (json.data || []) as TenantUser[]
    },
    enabled: Boolean(tenantId),
  })

  const users = useMemo(() => data ?? [], [data])
  const adminsCount = useMemo(() => users.filter((u) => (u.role || '').toLowerCase() === 'admin').length, [users])

  const inviteUser = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.message || 'Invite failed')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'users', tenantId] })
      setInviteEmail('')
      setInviteName('')
      setInviteRole('member')
      setInviteOpen(false)
      toast({ title: 'User invited', description: 'User account created. Invitation email will be sent.' })
    },
    onError: (e) => {
      toast({ title: 'Invite failed', description: e instanceof Error ? e.message : 'Unable to invite user', variant: 'destructive' })
    },
  })

  const updateUser = useMutation({
    mutationFn: async ({ userId, role, name }: { userId: string; role?: string; name?: string | null }) => {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, name }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Update failed')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'users', tenantId] })
      toast({ title: 'User updated' })
    },
    onError: (e) => {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Unable to update user', variant: 'destructive' })
    },
  })

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Delete failed')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'users', tenantId] })
      toast({ title: 'User removed' })
    },
    onError: (e) => {
      toast({ title: 'Remove failed', description: e instanceof Error ? e.message : 'Unable to remove user', variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Users</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Invite users, roles, and permissions</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {users.length} members
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {adminsCount} admins
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite user
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Invite a team member</DialogTitle>
                <DialogDescription>
                  Creates an account for this workspace. (Email sending can be added later; the account is created immediately.)
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</div>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@company.com" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Name (optional)</div>
                    <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</div>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteUser.isPending}>
                  Cancel
                </Button>
                <Button
                  onClick={() => inviteUser.mutate()}
                  disabled={!inviteEmail.trim() || inviteUser.isPending}
                >
                  {inviteUser.isPending ? 'Inviting…' : 'Invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <UsersIcon className="w-5 h-5" />
            Team members
          </CardTitle>
          <CardDescription>Invite, update roles, and remove access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Changes are logged in Activity.
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Show last login</div>
              <Switch checked={showLastLogin} onCheckedChange={setShowLastLogin} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'Failed to load users'}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No users found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite your first teammate to collaborate.</p>
              <div className="mt-4">
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite user
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    {showLastLogin && <TableHead>Last login</TableHead>}
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{u.email}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{u.name || '—'}</TableCell>
                      <TableCell>
                        <Select
                          value={(u.role || 'member').toLowerCase()}
                          onValueChange={(v) => updateUser.mutate({ userId: u.id, role: v })}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {showLastLogin && (
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remove ${u.email} from this workspace?`)) deleteUser.mutate(u.id)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          disabled={deleteUser.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
