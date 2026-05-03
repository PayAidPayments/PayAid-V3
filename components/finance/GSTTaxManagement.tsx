'use client'

import { useState } from 'react'
import { FileText, Calendar, AlertCircle, CheckCircle, Download, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface GSTReturn {
  id: string
  type: 'GSTR-1' | 'GSTR-3B' | 'GSTR-2A' | 'GSTR-9'
  period: string
  dueDate: Date
  status: 'filed' | 'pending' | 'overdue'
  filingDate?: Date
  taxLiability: number
  itc: number
}

interface TaxDeadline {
  id: string
  type: string
  dueDate: Date
  status: 'upcoming' | 'due' | 'overdue'
  daysRemaining: number
}

interface GSTTaxManagementProps {
  tenantId: string
}

export function GSTTaxManagement({ tenantId }: GSTTaxManagementProps) {
  const [gstReturns, setGstReturns] = useState<GSTReturn[]>([
    {
      id: '1',
      type: 'GSTR-3B',
      period: 'December 2025',
      dueDate: new Date('2026-01-20'),
      status: 'filed',
      filingDate: new Date('2026-01-15'),
      taxLiability: 150000,
      itc: 50000,
    },
    {
      id: '2',
      type: 'GSTR-1',
      period: 'January 2026',
      dueDate: new Date('2026-02-11'),
      status: 'pending',
      taxLiability: 0,
      itc: 0,
    },
  ])

  const [taxDeadlines, setTaxDeadlines] = useState<TaxDeadline[]>([
    {
      id: '1',
      type: 'GSTR-3B',
      dueDate: new Date('2026-02-20'),
      status: 'upcoming',
      daysRemaining: 30,
    },
    {
      id: '2',
      type: 'TDS Filing',
      dueDate: new Date('2026-02-15'),
      status: 'due',
      daysRemaining: 25,
    },
  ])

  const handleGenerateReturn = async (returnId: string) => {
    // API call to generate GST return
    alert(`Generating ${gstReturns.find(r => r.id === returnId)?.type}...`)
  }

  const handleFileReturn = async (returnId: string) => {
    // API call to file GST return
    setGstReturns(prev => prev.map(r => 
      r.id === returnId 
        ? { ...r, status: 'filed', filingDate: new Date() }
        : r
    ))
  }

  const totalTaxLiability = gstReturns.reduce((sum, r) => sum + r.taxLiability, 0)
  const totalITC = gstReturns.reduce((sum, r) => sum + r.itc, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GST & Tax Management</h2>
          <p className="text-gray-500">Manage GST returns, ITC tracking, and tax compliance</p>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tax Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatINRForDisplay(totalTaxLiability)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Total GST payable</p>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Input Tax Credit (ITC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {formatINRForDisplay(totalITC)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Available ITC</p>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Net Tax Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">
              {formatINRForDisplay(totalTaxLiability - totalITC)}
            </div>
            <p className="text-sm text-gray-500 mt-1">After ITC adjustment</p>
          </CardContent>
        </GlassCard>
      </div>

      {/* Tax Deadlines */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tax Calendar
          </CardTitle>
          <CardDescription>Upcoming tax filing deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {taxDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`p-4 border rounded-lg ${
                  deadline.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/20 border-red-200' :
                  deadline.status === 'due' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                  'bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{deadline.type}</div>
                    <div className="text-sm text-gray-500">
                      Due: {deadline.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        deadline.status === 'overdue' ? 'destructive' :
                        deadline.status === 'due' ? 'secondary' :
                        'default'
                      }
                    >
                      {deadline.daysRemaining} days
                    </Badge>
                    {deadline.status === 'overdue' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      {/* GST Returns */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">GST Returns</CardTitle>
          <CardDescription>Generate and file GST returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gstReturns.map((returnItem) => (
              <div
                key={returnItem.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-medium">{returnItem.type}</div>
                      <div className="text-sm text-gray-500">
                        Period: {returnItem.period} • Due: {returnItem.dueDate.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        returnItem.status === 'filed' ? 'default' :
                        returnItem.status === 'overdue' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {returnItem.status}
                    </Badge>
                    {returnItem.filingDate && (
                      <Badge variant="outline">
                        Filed: {returnItem.filingDate.toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Tax Liability: <strong>{formatINRForDisplay(returnItem.taxLiability)}</strong></span>
                    <span>ITC: <strong>{formatINRForDisplay(returnItem.itc)}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReturn(returnItem.id)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Generate
                  </Button>
                  {returnItem.status !== 'filed' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleFileReturn(returnItem.id)}
                    >
                      File Return
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
