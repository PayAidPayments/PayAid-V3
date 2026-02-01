'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, File, Calendar, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface DataExporterProps {
  tenantId: string
  dataType: 'contacts' | 'deals' | 'tasks' | 'invoices' | 'custom'
  onExport: (format: 'csv' | 'excel' | 'pdf', options: ExportOptions) => Promise<void>
}

interface ExportOptions {
  dateRange?: {
    start: Date
    end: Date
  }
  fields?: string[]
  filters?: Record<string, any>
  schedule?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    email?: string
  }
}

export function DataExporter({ tenantId, dataType, onExport }: DataExporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [scheduled, setScheduled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [scheduleEmail, setScheduleEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const options: ExportOptions = {
        dateRange: dateRange.start && dateRange.end
          ? {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            }
          : undefined,
        schedule: scheduled
          ? {
              enabled: true,
              frequency: scheduleFrequency,
              email: scheduleEmail,
            }
          : undefined,
      }
      await onExport(format, options)
      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Download className="w-4 h-4 mr-2" />
        Export Data
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export {dataType}</DialogTitle>
            <DialogDescription>
              Export your data in various formats or schedule automatic exports
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div>
              <Label>Export Format</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    format === 'csv'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-gray-500">Simple data export</div>
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    format === 'excel'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">Excel</div>
                  <div className="text-xs text-gray-500">Formatted spreadsheet</div>
                </button>
                <button
                  onClick={() => setFormat('pdf')}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    format === 'pdf'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <File className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-gray-500">Formatted report</div>
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>

            {/* Scheduled Export */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scheduled"
                  checked={scheduled}
                  onChange={(e) => setScheduled(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="scheduled" className="cursor-pointer">
                  Schedule automatic export
                </Label>
              </div>
              {scheduled && (
                <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                  <div>
                    <Label>Frequency</Label>
                    <select
                      value={scheduleFrequency}
                      onChange={(e) => setScheduleFrequency(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <Label>Email to send export</Label>
                    <Input
                      type="email"
                      value={scheduleEmail}
                      onChange={(e) => setScheduleEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
