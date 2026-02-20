'use client'

import { useEffect, useState } from 'react'
import { UsersTable } from '@/components/Admin/users/UsersTable'
import { InviteUserModal } from '@/components/Admin/users/InviteUserModal'
import { UserModuleAccessModal } from '@/components/Admin/users/UserModuleAccessModal'
import { UserRoleAssignmentModal } from '@/components/Admin/users/UserRoleAssignmentModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  lastLoginAt?: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setUsers(j.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenModuleAccess = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setIsModuleModalOpen(true)
  }

  const handleOpenRoleAssignment = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setIsRoleModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users & invites</h1>
          <p className="text-muted-foreground">Manage tenant users, roles, and module access</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>
      <UsersTable
        users={users}
        loading={loading}
        onRefresh={fetchUsers}
        onOpenModuleAccess={handleOpenModuleAccess}
        onOpenRoleAssignment={handleOpenRoleAssignment}
      />
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchUsers}
      />
      <UserModuleAccessModal
        isOpen={isModuleModalOpen}
        userId={selectedUserId}
        userName={selectedUserName}
        onClose={() => {
          setIsModuleModalOpen(false)
          setSelectedUserId(null)
          setSelectedUserName('')
        }}
        onSuccess={fetchUsers}
      />
      <UserRoleAssignmentModal
        isOpen={isRoleModalOpen}
        userId={selectedUserId}
        userName={selectedUserName}
        onClose={() => {
          setIsRoleModalOpen(false)
          setSelectedUserId(null)
          setSelectedUserName('')
        }}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
