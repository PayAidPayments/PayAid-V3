'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, Loader } from 'lucide-react'

export default function SubmitAppPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    icon: '',
    pricing: 'Free',
    version: '1.0.0',
    changelog: '',
  })

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/developer/portal/apps/submit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Submission failed')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push('/dashboard/developer/portal')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate(formData)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit App</h1>
        <p className="text-gray-600 mt-1">
          Submit your integration to the PayAid marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
            <CardDescription>Basic details about your integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Integration">Integration</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Payments">Payments</option>
                  <option value="Automation">Automation</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>
              <div>
                <Label htmlFor="pricing">Pricing</Label>
                <select
                  id="pricing"
                  value={formData.pricing}
                  onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                  <option value="Freemium">Freemium</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon URL</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-1"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="changelog">Changelog</Label>
              <Textarea
                id="changelog"
                value={formData.changelog}
                onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                rows={3}
                className="mt-1"
                placeholder="What's new in this version..."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Review'
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
