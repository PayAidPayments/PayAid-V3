'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAuthHeaders } from '@/lib/api/client'

const DATA_SOURCES = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'deals', label: 'Deals' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'orders', label: 'Orders' },
  { value: 'expenses', label: 'Expenses' },
]

const COMMON_FIELDS: Record<string, string[]> = {
  contacts: ['id', 'name', 'email', 'phone', 'company', 'type', 'status', 'createdAt'],
  deals: ['id', 'name', 'amount', 'stage', 'status', 'contactName', 'contactEmail', 'createdAt'],
  invoices: ['id', 'invoiceNumber', 'invoiceDate', 'total', 'status', 'customerName', 'customerEmail', 'createdAt'],
  orders: ['id', 'orderNumber', 'total', 'status', 'customerName', 'customerEmail', 'createdAt'],
  expenses: ['id', 'description', 'amount', 'category', 'date', 'status', 'employeeName', 'employeeEmail', 'createdAt'],
}

export default function NewReportPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    dataSource: '',
    selectedFields: [] as string[],
    isPublic: false,
  })

  const availableFields = formData.dataSource ? (COMMON_FIELDS[formData.dataSource] || []) : []

  const createReport = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create report')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/reports/${data.report.id}`)
    },
  })

  const toggleField = (field: string) => {
    if (formData.selectedFields.includes(field)) {
      setFormData({
        ...formData,
        selectedFields: formData.selectedFields.filter(f => f !== field),
      })
    } else {
      setFormData({
        ...formData,
        selectedFields: [...formData.selectedFields, field],
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.dataSource) {
      alert('Please select a data source')
      return
    }

    if (formData.selectedFields.length === 0) {
      alert('Please select at least one field')
      return
    }

    const config = {
      dataSource: formData.dataSource,
      fields: formData.selectedFields,
      grouping: null,
      sorting: null,
      filters: {},
    }

    const submitData: any = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      config,
      isPublic: formData.isPublic,
    }

    createReport.mutate(submitData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Report</h1>
        <p className="text-gray-600 mt-1">Build a custom report from your data</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
            <CardDescription>Enter the basic information for your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Sales Report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Report Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what this report shows..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source *</Label>
              <Select
                value={formData.dataSource}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    dataSource: value,
                    selectedFields: [], // Reset fields when data source changes
                  })
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {formData.dataSource && (
          <Card>
            <CardHeader>
              <CardTitle>Select Fields</CardTitle>
              <CardDescription>Choose which fields to include in your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFields.map((field) => (
                  <label
                    key={field}
                    className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedFields.includes(field)}
                      onChange={() => toggleField(field)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{field}</span>
                  </label>
                ))}
              </div>
              {formData.selectedFields.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Selected Fields:</div>
                  <div className="text-sm text-blue-700 mt-1">
                    {formData.selectedFields.join(', ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Make this report public (visible to all users in your organization)</span>
            </label>
          </CardContent>
        </Card>

        {createReport.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              {createReport.error instanceof Error ? createReport.error.message : 'Failed to create report'}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createReport.isPending || !formData.dataSource || formData.selectedFields.length === 0}
          >
            {createReport.isPending ? 'Creating...' : 'Create Report'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

