'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { X } from 'lucide-react'

interface UserRoleAssignmentModalProps {
  isOpen: boolean
  userId: string | null
  userName: string
  onClose: () => void
  onSuccess: () => void
}

interface Role {
  id: string
  roleName: string
  roleType: string
  description: string | null
}

export function UserRoleAssignmentModal({
  isOpen,
  userId,
  userName,
  onClose,
  onSuccess,
}: UserRoleAssignmentModalProps) {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true)
      // Fetch available roles
      fetch('/api/admin/roles')
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((j) => setRoles(j.data || []))

      // Fetch user's current roles
      fetch(`/api/admin/users/${userId}/roles`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((j) => {
          const assignedRoles = (j.data || []).map((r: { roleId: string }) => r.roleId)
          setUserRoles(new Set(assignedRoles))
        })
        .catch(() => {
          // If endpoint doesn't exist yet, that's okay
          setUserRoles(new Set())
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, userId])

  if (!isOpen || !userId) return null

  const handleToggleRole = (roleId: string) => {
    const newSet = new Set(userRoles)
    if (newSet.has(roleId)) {
      newSet.delete(roleId)
    } else {
      newSet.add(roleId)
    }
    setUserRoles(newSet)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: Array.from(userRoles) }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update roles')
      }

      toast({
        title: 'Success',
        description: 'User roles updated successfully',
      })

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update roles',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Assign Roles
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{userName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No custom roles available. Create roles in the Roles & Permissions section.
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {role.roleName}
                    </div>
                    {role.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {role.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Type: {role.roleType}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={userRoles.has(role.id)}
                    onChange={() => handleToggleRole(role.id)}
                    className="ml-4 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
