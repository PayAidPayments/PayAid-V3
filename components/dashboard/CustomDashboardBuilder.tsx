/**
 * Custom Dashboard Builder Component
 * Drag-and-drop dashboard builder for user-configurable dashboards
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { GripVertical, Plus, Trash2, Save, LayoutGrid } from 'lucide-react'

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'list' | 'table' | 'kanban'
  title: string
  config: {
    dataSource?: string
    metric?: string
    chartType?: 'line' | 'bar' | 'pie' | 'area'
    filters?: Record<string, any>
    size?: 'small' | 'medium' | 'large'
  }
  position: { x: number; y: number; w: number; h: number }
}

interface CustomDashboardBuilderProps {
  tenantId: string
  dashboardId?: string
  onSave?: (dashboard: { name: string; widgets: DashboardWidget[] }) => void
}

const WIDGET_TYPES = [
  { value: 'metric', label: 'Metric Card' },
  { value: 'chart', label: 'Chart' },
  { value: 'list', label: 'List View' },
  { value: 'table', label: 'Table' },
  { value: 'kanban', label: 'Kanban Board' },
]

const DATA_SOURCES = [
  { value: 'deals', label: 'Deals' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'pipeline', label: 'Pipeline' },
]

export function CustomDashboardBuilder({ tenantId, dashboardId, onSave }: CustomDashboardBuilderProps) {
  const [dashboardName, setDashboardName] = useState('')
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const addWidget = () => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: 'metric',
      title: 'New Widget',
      config: {
        size: 'medium',
      },
      position: { x: 0, y: widgets.length, w: 4, h: 3 },
    }
    setWidgets([...widgets, newWidget])
    setSelectedWidget(newWidget)
  }

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)))
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget({ ...selectedWidget, ...updates })
    }
  }

  const deleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId))
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null)
    }
  }

  const handleSave = async () => {
    if (!dashboardName.trim()) {
      alert('Please enter a dashboard name')
      return
    }

    if (widgets.length === 0) {
      alert('Please add at least one widget')
      return
    }

    const dashboard = {
      name: dashboardName,
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        title: w.title,
        config: w.config,
        position: w.position,
      })),
    }

    if (onSave) {
      onSave(dashboard)
    } else {
      try {
        const response = await fetch('/api/dashboards/custom' + (dashboardId ? `/${dashboardId}` : ''), {
          method: dashboardId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dashboard),
        })

        if (!response.ok) throw new Error('Failed to save dashboard')

        alert('Dashboard saved successfully!')
      } catch (error) {
        console.error('Error saving dashboard:', error)
        alert('Failed to save dashboard')
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Dashboard Builder</CardTitle>
              <CardDescription>Create your own dashboard with drag-and-drop widgets</CardDescription>
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="My Custom Dashboard"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dashboard Canvas</CardTitle>
                <Button variant="outline" size="sm" onClick={addWidget}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No widgets yet. Click "Add Widget" to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  {widgets.map((widget) => (
                    <Card
                      key={widget.id}
                      className={`col-span-${widget.position.w} cursor-move ${
                        selectedWidget?.id === widget.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedWidget(widget)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{widget.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteWidget(widget.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-gray-500">
                          {widget.type} - {widget.config.dataSource || 'No data source'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Widget Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Widget Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedWidget ? (
                <div className="space-y-4">
                  <div>
                    <Label>Widget Title</Label>
                    <Input
                      value={selectedWidget.title}
                      onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Widget Type</Label>
                    <CustomSelect
                      value={selectedWidget.type}
                      onValueChange={(value: string) =>
                        updateWidget(selectedWidget.id, { type: value as DashboardWidget['type'] })
                      }
                      placeholder="Select widget type"
                    >
                      <CustomSelectTrigger className="mt-1">
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        {WIDGET_TYPES.map((type) => (
                          <CustomSelectItem key={type.value} value={type.value}>
                            {type.label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>

                  <div>
                    <Label>Data Source</Label>
                    <CustomSelect
                      value={selectedWidget.config.dataSource || ''}
                      onValueChange={(value: string) =>
                        updateWidget(selectedWidget.id, {
                          config: { ...selectedWidget.config, dataSource: value },
                        })
                      }
                      placeholder="Select data source"
                    >
                      <CustomSelectTrigger className="mt-1">
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        {DATA_SOURCES.map((source) => (
                          <CustomSelectItem key={source.value} value={source.value}>
                            {source.label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>

                  {selectedWidget.type === 'chart' && (
                    <div>
                      <Label>Chart Type</Label>
                      <CustomSelect
                        value={selectedWidget.config.chartType || 'line'}
                        onValueChange={(value: string) =>
                          updateWidget(selectedWidget.id, {
                            config: { ...selectedWidget.config, chartType: value as any },
                          })
                        }
                        placeholder="Select chart type"
                      >
                        <CustomSelectTrigger className="mt-1">
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="line">Line Chart</CustomSelectItem>
                          <CustomSelectItem value="bar">Bar Chart</CustomSelectItem>
                          <CustomSelectItem value="pie">Pie Chart</CustomSelectItem>
                          <CustomSelectItem value="area">Area Chart</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>
                  )}

                  <div>
                    <Label>Size</Label>
                    <CustomSelect
                      value={selectedWidget.config.size || 'medium'}
                      onValueChange={(value: string) =>
                        updateWidget(selectedWidget.id, {
                          config: { ...selectedWidget.config, size: value as any },
                          position: {
                            ...selectedWidget.position,
                            w: value === 'small' ? 3 : value === 'large' ? 6 : 4,
                            h: value === 'small' ? 2 : value === 'large' ? 4 : 3,
                          },
                        })
                      }
                      placeholder="Select size"
                    >
                      <CustomSelectTrigger className="mt-1">
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        <CustomSelectItem value="small">Small</CustomSelectItem>
                        <CustomSelectItem value="medium">Medium</CustomSelectItem>
                        <CustomSelectItem value="large">Large</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Select a widget to configure it
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
