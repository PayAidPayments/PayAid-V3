'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Component {
  name: string
  code: string
  type: 'FIXED' | 'PERCENTAGE'
  amount?: number
  percent?: number
  isTaxable: boolean
}

export default function NewSalaryStructurePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
  })
  const [components, setComponents] = useState<Component[]>([
    { name: 'Basic', code: 'BASIC', type: 'PERCENTAGE', percent: 40, isTaxable: true },
    { name: 'HRA', code: 'HRA', type: 'PERCENTAGE', percent: 20, isTaxable: false },
    { name: 'Allowances', code: 'ALLOWANCES', type: 'PERCENTAGE', percent: 40, isTaxable: true },
  ])
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const structureJson = {
        components: components.map((comp) => ({
          name: comp.name,
          code: comp.code,
          type: comp.type,
          amount: comp.amount,
          percent: comp.percent,
          isTaxable: comp.isTaxable,
        })),
      }

      const response = await fetch('/api/hr/payroll/salary-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          structureJson,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create salary structure')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/hr/payroll/salary-structures/${data.id}`)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate(formData)
  }

  const addComponent = () => {
    setComponents([
      ...components,
      { name: '', code: '', type: 'FIXED', isTaxable: true },
    ])
  }

  const updateComponent = (index: number, field: keyof Component, value: any) => {
    const updated = [...components]
    updated[index] = { ...updated[index], [field]: value }
    setComponents(updated)
  }

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Salary Structure</h1>
          <p className="mt-2 text-gray-600">Create a new salary component structure</p>
        </div>
        <Link href="/dashboard/hr/payroll/salary-structures">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Structure Information</CardTitle>
          <CardDescription>Enter the salary structure details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Structure Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Standard Structure, Executive Structure"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Describe this salary structure..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Set as Default</span>
                </label>
              </div>
            </div>

            {/* Components */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Salary Components</h3>
                <Button type="button" onClick={addComponent} variant="outline">
                  Add Component
                </Button>
              </div>

              {components.map((comp, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                          value={comp.name}
                          onChange={(e) => updateComponent(index, 'name', e.target.value)}
                          placeholder="e.g., Basic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                        <Input
                          value={comp.code}
                          onChange={(e) => updateComponent(index, 'code', e.target.value.toUpperCase())}
                          placeholder="e.g., BASIC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={comp.type}
                          onChange={(e) => updateComponent(index, 'type', e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300 px-3"
                        >
                          <option value="FIXED">Fixed Amount</option>
                          <option value="PERCENTAGE">Percentage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {comp.type === 'FIXED' ? 'Amount ₹' : 'Percentage %'}
                        </label>
                        <Input
                          type="number"
                          step={comp.type === 'PERCENTAGE' ? '0.01' : '1'}
                          value={comp.type === 'FIXED' ? comp.amount || '' : comp.percent || ''}
                          onChange={(e) =>
                            updateComponent(
                              index,
                              comp.type === 'FIXED' ? 'amount' : 'percent',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder={comp.type === 'FIXED' ? '0' : '0'}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={comp.isTaxable}
                            onChange={(e) => updateComponent(index, 'isTaxable', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Taxable</span>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeComponent(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/hr/payroll/salary-structures">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Structure'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
