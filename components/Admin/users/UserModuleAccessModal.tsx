'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { X, Check } from 'lucide-react'
import { modules as moduleConfigs, ModuleConfig } from '@/lib/modules.config'

interface UserModuleAccessModalProps {
  isOpen: boolean
  userId: string | null
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export function UserModuleAccessModal({
  isOpen,
  userId,
  userName,
  onClose,
  onSuccess,
}: UserModuleAccessModalProps) {
  const { toast } = useToast()
  const [userModules, setUserModules] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true)
      fetch(`/api/admin/users/${userId}/modules`)
        .then((r) => (r.ok ? r.json() : { data: {} }))
        .then((j) => {
          const modules = j.data || {}
          const moduleMap: Record<string, boolean> = {}
          moduleConfigs.forEach((config) => {
            moduleMap[config.id] = modules[config.id] || false
          })
          setUserModules(moduleMap)
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to load module access',
            variant: 'destructive',
          })
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, userId, toast])

  if (!isOpen || !userId) return null

  const handleToggleModule = (moduleKey: string) => {
    setUserModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: userModules }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update module access')
      }

      toast({
        title: 'Success',
        description: 'Module access updated successfully',
      })

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update module access',
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
              Module Access
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{userName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading modules...</div>
          ) : (
            <div className="space-y-3">
              {moduleConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {config.name}
                    </div>
                    {config.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {config.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleModule(config.id)}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userModules[config.id] ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userModules[config.id] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
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
