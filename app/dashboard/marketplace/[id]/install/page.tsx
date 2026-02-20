'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { getDashboardUrl } from '@/lib/utils/dashboard-url'
import { CheckCircle, Loader } from 'lucide-react'

const APP_CONFIGS: Record<string, { fields: Array<{ key: string; label: string; type: string; required: boolean }> }> = {
  'tally-sync': {
    fields: [
      { key: 'tallyUrl', label: 'Tally Server URL', type: 'url', required: true },
      { key: 'syncDirection', label: 'Sync Direction', type: 'select', required: true },
    ],
  },
  'razorpay-connector': {
    fields: [
      { key: 'apiKey', label: 'Razorpay API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'Razorpay API Secret', type: 'password', required: true },
    ],
  },
}

export default function InstallAppPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params?.id as string
  const [formData, setFormData] = useState<Record<string, string>>({})

  const installMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/marketplace/apps/install', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ appId, config: data }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Installation failed')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(getDashboardUrl('/marketplace'))
    },
  })

  const config = APP_CONFIGS[appId] || { fields: [] }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    installMutation.mutate(formData)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Install App</h1>
        <p className="text-gray-600 mt-1">Configure and install {appId}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Enter required settings for this app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === 'select' ? (
                  <select
                    id={field.key}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.key === 'syncDirection' && (
                      <>
                        <option value="payaid_to_tally">PayAid → Tally</option>
                        <option value="tally_to_payaid">Tally → PayAid</option>
                        <option value="both">Both Ways</option>
                      </>
                    )}
                  </select>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    required={field.required}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={installMutation.isPending}>
                {installMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  'Install App'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
