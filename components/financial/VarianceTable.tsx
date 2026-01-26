/**
 * Variance Table Component
 * Financial Dashboard Module 1.3
 * 
 * Displays budget vs actual comparison with variance analysis
 */

'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export interface VarianceRecord {
  accountCode: string
  accountName: string
  accountType: string
  budgeted: number
  actual: number
  variance: number
  variancePercentage: number
  varianceType: 'favorable' | 'unfavorable' | 'neutral'
  requiresInvestigation: boolean
}

interface VarianceTableProps {
  data: VarianceRecord[]
  onInvestigate?: (accountCode: string) => void
}

export function VarianceTable({ data, onInvestigate }: VarianceTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Budgeted</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">% Variance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No variance data available
              </TableCell>
            </TableRow>
          ) : (
            data.map((record) => (
              <TableRow key={record.accountCode}>
                <TableCell>
                  <div>
                    <div className="font-medium">{record.accountName}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.accountCode}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(record.budgeted)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(record.actual)}
                </TableCell>
                <TableCell
                  className={`text-right ${
                    record.varianceType === 'favorable'
                      ? 'text-green-600'
                      : record.varianceType === 'unfavorable'
                        ? 'text-red-600'
                        : ''
                  }`}
                >
                  {formatCurrency(record.variance)}
                </TableCell>
                <TableCell
                  className={`text-right ${
                    record.varianceType === 'favorable'
                      ? 'text-green-600'
                      : record.varianceType === 'unfavorable'
                        ? 'text-red-600'
                        : ''
                  }`}
                >
                  {formatPercentage(record.variancePercentage)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.varianceType === 'favorable'
                        ? 'default'
                        : record.varianceType === 'unfavorable'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {record.varianceType === 'favorable' && (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    )}
                    {record.varianceType === 'unfavorable' && (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {record.varianceType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {record.requiresInvestigation && (
                    <button
                      onClick={() => onInvestigate?.(record.accountCode)}
                      className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Investigate
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
