'use client'

import { useState } from 'react'
import { GripVertical, X, Plus, BarChart3, TrendingUp, DollarSign, FileText, Calendar } from 'lucide-react'
import { motion, Reorder } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Widget {
  id: string
  type: 'revenue' | 'expenses' | 'cash-flow' | 'profit' | 'invoices' | 'gst' | 'custom'
  title: string
  icon: React.ReactNode
  size: 'small' | 'medium' | 'large'
  enabled: boolean
}

interface DashboardCustomizerProps {
  tenantId: string
  widgets: Widget[]
  onWidgetsChange: (widgets: Widget[]) => void
  onSave: (widgets: Widget[]) => Promise<void>
}

export function DashboardCustomizer({ tenantId, widgets, onWidgetsChange, onSave }: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [availableWidgets] = useState<Widget[]>([
    { id: 'revenue', type: 'revenue', title: 'Revenue Chart', icon: <TrendingUp className="w-5 h-5" />, size: 'medium', enabled: true },
    { id: 'expenses', type: 'expenses', title: 'Expense Breakdown', icon: <DollarSign className="w-5 h-5" />, size: 'medium', enabled: true },
    { id: 'cash-flow', type: 'cash-flow', title: 'Cash Flow', icon: <BarChart3 className="w-5 h-5" />, size: 'large', enabled: true },
    { id: 'profit', type: 'profit', title: 'Profit Margin', icon: <TrendingUp className="w-5 h-5" />, size: 'small', enabled: true },
    { id: 'invoices', type: 'invoices', title: 'Recent Invoices', icon: <FileText className="w-5 h-5" />, size: 'small', enabled: false },
    { id: 'gst', type: 'gst', title: 'GST Summary', icon: <FileText className="w-5 h-5" />, size: 'small', enabled: false },
  ])

  const toggleWidget = (widgetId: string) => {
    const updated = widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    )
    onWidgetsChange(updated)
  }

  const changeWidgetSize = (widgetId: string, size: Widget['size']) => {
    const updated = widgets.map(w => 
      w.id === widgetId ? { ...w, size } : w
    )
    onWidgetsChange(updated)
  }

  const handleSave = async () => {
    await onSave(widgets)
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Customize Dashboard
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Finance Dashboard</DialogTitle>
            <DialogDescription>
              Drag to reorder widgets, toggle visibility, and adjust sizes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Available Widgets */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Available Widgets</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableWidgets.map((widget) => {
                  const isEnabled = widgets.find(w => w.id === widget.id)?.enabled || false
                  return (
                    <div
                      key={widget.id}
                      className={`p-3 border rounded-lg flex items-center justify-between ${
                        isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {widget.icon}
                        <span className="text-sm font-medium">{widget.title}</span>
                      </div>
                      <Button
                        variant={isEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (!isEnabled) {
                            onWidgetsChange([...widgets, { ...widget, enabled: true }])
                          } else {
                            toggleWidget(widget.id)
                          }
                        }}
                      >
                        {isEnabled ? 'Remove' : 'Add'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Enabled Widgets - Reorderable */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Dashboard Layout</h3>
              <Reorder.Group
                axis="y"
                values={widgets.filter(w => w.enabled)}
                onReorder={(newOrder) => {
                  const disabled = widgets.filter(w => !w.enabled)
                  onWidgetsChange([...newOrder, ...disabled])
                }}
                className="space-y-2"
              >
                {widgets.filter(w => w.enabled).map((widget) => (
                  <Reorder.Item
                    key={widget.id}
                    value={widget}
                    className="p-4 border rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between cursor-move"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      {widget.icon}
                      <span className="font-medium">{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={widget.size}
                        onChange={(e) => changeWidgetSize(widget.id, e.target.value as Widget['size'])}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWidget(widget.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Layout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
