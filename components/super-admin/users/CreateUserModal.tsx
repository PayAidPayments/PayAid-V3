'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { X } from 'lucide-react'

interface Tenant {
  id: string
  name: string
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'member',
    tenantId: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingTenants, setLoadingTenants] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingTenants(true)
      fetch('/api/super-admin/tenants')
        .then(async (r) => {
          if (!r.ok) {
            const errorData = await r.json().catch(() => ({ error: 'Failed to load tenants' }))
            throw new Error(errorData.error || `HTTP ${r.status}`)
          }
          return r.json()
        })
        .then((j) => {
          const tenantList = Array.isArray(j.data) ? j.data.map((t: any) => ({
            id: t.id,
            name: t.name || t.subdomain || 'Unnamed Tenant',
          })) : []
          setTenants(tenantList)
          if (tenantList.length > 0) {
            setFormData((prev) => ({ ...prev, tenantId: prev.tenantId || tenantList[0].id }))
          } else {
            setFormData((prev) => ({ ...prev, tenantId: '' }))
          }
        })
        .catch((error) => {
          console.error('Failed to load tenants:', error)
          setTenants([])
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load tenants. Please ensure you are logged in as Super Admin.',
            variant: 'destructive',
          })
        })
        .finally(() => setLoadingTenants(false))
    }
  }, [isOpen, toast])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create user via Super Admin API
      const response = await fetch('/api/super-admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast({
        title: 'Success',
        description: 'User created successfully. Invitation email sent.',
      })

      onSuccess()
      onClose()
      setFormData({
        email: '',
        name: '',
        role: 'member',
        tenantId: tenants.length > 0 ? tenants[0].id : '',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New User</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tenant *
            </label>
            <select
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
              disabled={loadingTenants || tenants.length === 0}
            >
              {loadingTenants ? (
                <option>Loading tenants...</option>
              ) : tenants.length === 0 ? (
                <option value="">No tenants available - Create a tenant first</option>
              ) : (
                <>
                  <option value="">Select a tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {!loadingTenants && tenants.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                No tenants found. Create a tenant first before adding users.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || tenants.length === 0}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
