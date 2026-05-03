'use client'

import { useState } from 'react'
import { FileText, Download, Calendar, BarChart3, TrendingUp, DollarSign, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FinancialReportsProps {
  tenantId: string
}

const reportTypes = [
  {
    id: 'pl',
    name: 'Profit & Loss Statement',
    description: 'Income statement showing revenue, expenses, and profit',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity snapshot',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Statement',
    description: 'Operating, investing, and financing cash flows',
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    id: 'trial-balance',
    name: 'Trial Balance',
    description: 'All accounts with debit and credit balances',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    id: 'aged-receivables',
    name: 'Aged Receivables',
    description: 'Outstanding invoices by aging period',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'aged-payables',
    name: 'Aged Payables',
    description: 'Outstanding bills by aging period',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'financial-ratios',
    name: 'Financial Ratios',
    description: 'Key financial ratios and metrics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
]

export function FinancialReports({ tenantId }: FinancialReportsProps) {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reportPeriod, setReportPeriod] = useState({
    startDate: '',
    endDate: '',
    format: 'pdf' as 'pdf' | 'excel',
  })

  const handleGenerateReport = async (reportId: string) => {
    setSelectedReport(reportId)
    setShowGenerateDialog(true)
  }

  const handleDownload = async () => {
    if (!selectedReport) return
    // API call to generate and download report
    alert(`Generating ${reportTypes.find(r => r.id === selectedReport)?.name}...`)
    setShowGenerateDialog(false)
  }

  const handleScheduleReport = async () => {
    if (!selectedReport) return
    // API call to schedule report
    alert(`Scheduling ${reportTypes.find(r => r.id === selectedReport)?.name}...`)
    setShowGenerateDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-gray-500">Generate comprehensive financial reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <GlassCard key={report.id}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  {report.icon}
                </div>
                <CardTitle className="text-lg">{report.name}</CardTitle>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleGenerateReport(report.id)}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Generate {reportTypes.find(r => r.id === selectedReport)?.name}
            </DialogTitle>
            <DialogDescription>
              Select date range and format for the report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={reportPeriod.startDate}
                  onChange={(e) => setReportPeriod({ ...reportPeriod, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={reportPeriod.endDate}
                  onChange={(e) => setReportPeriod({ ...reportPeriod, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Format</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="pdf"
                    checked={reportPeriod.format === 'pdf'}
                    onChange={(e) => setReportPeriod({ ...reportPeriod, format: 'pdf' })}
                  />
                  PDF
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="excel"
                    checked={reportPeriod.format === 'excel'}
                    onChange={(e) => setReportPeriod({ ...reportPeriod, format: 'excel' })}
                  />
                  Excel
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleScheduleReport}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
