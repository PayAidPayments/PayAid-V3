'use client'

import { useEffect, useState } from 'react'
import { GlobalUsersTable } from '@/components/super-admin/users/GlobalUsersTable'
import { CreateUserModal } from '@/components/super-admin/users/CreateUserModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

type GlobalUserRow = {
  id: string
  email: string
  name: string | null
  role: string
  tenantId: string
  lastLoginAt: string | null
  twoFactorEnabled: boolean
  createdAt: string
  tenant?: { name: string }
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<GlobalUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/super-admin/users')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setUsers(j.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Users</h1>
          <p className="text-muted-foreground">Search across all tenants</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>
      <GlobalUsersTable users={users} loading={loading} onRefresh={fetchUsers} />
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
