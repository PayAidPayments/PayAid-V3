'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Edit, Check, X } from 'lucide-react'

interface TaxRule {
  id: string
  name: string
  taxType: string
  rate: number
  isDefault: boolean
  appliesTo: string
  isExempt: boolean
  exemptionReason?: string
  isActive: boolean
}

export default function TaxRulesPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    taxType: 'GST',
    rate: 18,
    isDefault: false,
    appliesTo: 'all',
    isExempt: false,
    exemptionReason: '',
  })

  const { data, isLoading, refetch } = useQuery<{ rules: TaxRule[] }>({
    queryKey: ['tax-rules'],
    queryFn: async () => {
      const res = await fetch('/api/tax/rules', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return { rules: [] }
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/tax/rules', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create tax rule')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] })
      setShowNewForm(false)
      setFormData({
        name: '',
        taxType: 'GST',
        rate: 18,
        isDefault: false,
        appliesTo: 'all',
        isExempt: false,
        exemptionReason: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tax/rules/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete tax rule')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const rules = data?.rules || []

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Rules</h1>
          <p className="text-gray-600 mt-1">
            Manage tax rules for invoices. Create rules for GST, VAT, Sales Tax, or custom tax types.
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Tax Rule
        </Button>
      </div>

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Tax Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., GST 18%"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="taxType">Tax Type *</Label>
                  <select
                    id="taxType"
                    value={formData.taxType}
                    onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="SALES_TAX">Sales Tax</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="rate">Tax Rate (%) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="appliesTo">Applies To</Label>
                  <select
                    id="appliesTo"
                    value={formData.appliesTo}
                    onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Items</option>
                    <option value="products">Products Only</option>
                    <option value="services">Services Only</option>
                    <option value="specific">Specific Items</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Set as default tax rule</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isExempt}
                    onChange={(e) => setFormData({ ...formData, isExempt: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Tax exemption rule</span>
                </label>
              </div>
              {formData.isExempt && (
                <div>
                  <Label htmlFor="exemptionReason">Exemption Reason</Label>
                  <Textarea
                    id="exemptionReason"
                    value={formData.exemptionReason}
                    onChange={(e) => setFormData({ ...formData, exemptionReason: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewForm(false)
                    setFormData({
                      name: '',
                      taxType: 'GST',
                      rate: 18,
                      isDefault: false,
                      appliesTo: 'all',
                      isExempt: false,
                      exemptionReason: '',
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Tax Rules</CardTitle>
          <CardDescription>Manage existing tax rules</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading tax rules...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No tax rules yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rule.name}</span>
                      {rule.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          Default
                        </span>
                      )}
                      {rule.isExempt && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                          Exempt
                        </span>
                      )}
                      {!rule.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Type: {rule.taxType} • Rate: {rule.isExempt ? 'Exempt' : `${rule.rate}%`} • Applies to: {rule.appliesTo}
                    </div>
                    {rule.exemptionReason && (
                      <div className="text-xs text-gray-500 mt-1">
                        Reason: {rule.exemptionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete tax rule "${rule.name}"?`)) {
                          deleteMutation.mutate(rule.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
