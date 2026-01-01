'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, BarChart3, PieChart, LineChart, Table } from 'lucide-react'

const AVAILABLE_FIELDS = [
  { id: 'contact.name', label: 'Contact Name', type: 'text' },
  { id: 'contact.email', label: 'Contact Email', type: 'email' },
  { id: 'deal.value', label: 'Deal Value', type: 'number' },
  { id: 'deal.stage', label: 'Deal Stage', type: 'text' },
  { id: 'invoice.amount', label: 'Invoice Amount', type: 'number' },
  { id: 'invoice.status', label: 'Invoice Status', type: 'text' },
  { id: 'project.name', label: 'Project Name', type: 'text' },
  { id: 'project.progress', label: 'Project Progress', type: 'number' },
  { id: 'task.status', label: 'Task Status', type: 'text' },
  { id: 'task.priority', label: 'Task Priority', type: 'text' },
]

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Chart', icon: LineChart },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
  { id: 'table', label: 'Table', icon: Table },
]

interface ReportField {
  id: string
  fieldId: string
  label: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  chartType?: string
}

function ReportBuilder() {
  const queryClient = useQueryClient()
  const [reportName, setReportName] = useState('')
  const [selectedFields, setSelectedFields] = useState<ReportField[]>([])
  const [draggedField, setDraggedField] = useState<string | null>(null)

  const saveReport = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to save report')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      alert('Report saved successfully!')
    },
  })

  const addField = (fieldId: string) => {
    const field = AVAILABLE_FIELDS.find((f) => f.id === fieldId)
    if (!field) return

    const newField: ReportField = {
      id: `field-${Date.now()}`,
      fieldId: field.id,
      label: field.label,
    }
    setSelectedFields([...selectedFields, newField])
  }

  const removeField = (id: string) => {
    setSelectedFields(selectedFields.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<ReportField>) => {
    setSelectedFields(
      selectedFields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    )
  }

  const handleDragStart = (id: string) => {
    setDraggedField(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedField) return

    const draggedIndex = selectedFields.findIndex((f) => f.id === draggedField)
    if (draggedIndex === -1) return

    const newFields = [...selectedFields]
    const [removed] = newFields.splice(draggedIndex, 1)
    newFields.splice(targetIndex, 0, removed)
    setSelectedFields(newFields)
    setDraggedField(null)
  }

  const handleSave = () => {
    if (!reportName || selectedFields.length === 0) {
      alert('Please provide a report name and at least one field')
      return
    }

    saveReport.mutate({
      name: reportName,
      description: 'Custom report',
      config: {
        fields: selectedFields,
        chartType: selectedFields[0]?.chartType || 'table',
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Report Builder</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create custom reports with drag-and-drop fields
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Available Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Available Fields</CardTitle>
            <CardDescription>Drag fields to add to your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {AVAILABLE_FIELDS.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => addField(field.id)}
                className="p-3 border rounded-lg cursor-move hover:bg-gray-50"
              >
                <div className="font-medium text-sm">{field.label}</div>
                <div className="text-xs text-gray-500">{field.type}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Configure your report fields and visualization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Name *</label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Sales Performance Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Report Fields</label>
              <div className="space-y-2 min-h-[200px]">
                {selectedFields.map((field, index) => {
                  const fieldDef = AVAILABLE_FIELDS.find((f) => f.id === field.fieldId)
                  return (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() => handleDragStart(field.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                        <div className="flex-1 space-y-3">
                          <div className="font-medium">{fieldDef?.label || field.fieldId}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Aggregation
                              </label>
                              <select
                                value={field.aggregation || ''}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    aggregation: e.target.value as any,
                                  })
                                }
                                className="w-full px-2 py-1 text-sm border rounded"
                              >
                                <option value="">None</option>
                                <option value="sum">Sum</option>
                                <option value="avg">Average</option>
                                <option value="count">Count</option>
                                <option value="min">Min</option>
                                <option value="max">Max</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Chart Type
                              </label>
                              <select
                                value={field.chartType || 'table'}
                                onChange={(e) =>
                                  updateField(field.id, { chartType: e.target.value })
                                }
                                className="w-full px-2 py-1 text-sm border rounded"
                              >
                                {CHART_TYPES.map((type) => (
                                  <option key={type.id} value={type.id}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {selectedFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Drag fields from the left panel to build your report
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saveReport.isPending}>
                {saveReport.isPending ? 'Saving...' : 'Save Report'}
              </Button>
              <Link href="/dashboard/reports">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ReportBuilderPage() {
  return <ReportBuilder />
}

