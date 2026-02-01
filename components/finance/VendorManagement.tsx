'use client'

import { useState } from 'react'
import { Building2, DollarSign, TrendingUp, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface Vendor {
  id: string
  name: string
  totalSpent: number
  creditLimit: number
  outstanding: number
  paymentTerms: string
  lastPaymentDate?: Date
  performance: 'excellent' | 'good' | 'average' | 'poor'
}

interface VendorManagementProps {
  tenantId: string
}

export function VendorManagement({ tenantId }: VendorManagementProps) {
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: '1',
      name: 'ABC Suppliers',
      totalSpent: 500000,
      creditLimit: 1000000,
      outstanding: 150000,
      paymentTerms: 'Net 30',
      lastPaymentDate: new Date('2026-01-10'),
      performance: 'excellent',
    },
    {
      id: '2',
      name: 'XYZ Logistics',
      totalSpent: 300000,
      creditLimit: 500000,
      outstanding: 75000,
      paymentTerms: 'Net 15',
      lastPaymentDate: new Date('2026-01-05'),
      performance: 'good',
    },
  ])

  const getPerformanceColor = (performance: Vendor['performance']) => {
    switch (performance) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'average': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Management</h2>
          <p className="text-gray-500">Track vendor payments and performance</p>
        </div>
      </div>

      {/* Vendor Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{vendors.length}</div>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">
              {formatINRForDisplay(vendors.reduce((sum, v) => sum + v.totalSpent, 0))}
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {formatINRForDisplay(vendors.reduce((sum, v) => sum + v.outstanding, 0))}
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Credit Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {((vendors.reduce((sum, v) => sum + v.outstanding, 0) / vendors.reduce((sum, v) => sum + v.creditLimit, 0)) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Vendors List */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Vendors</CardTitle>
          <CardDescription>Vendor payment tracking and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-gray-500">
                        Terms: {vendor.paymentTerms} • Last payment: {vendor.lastPaymentDate?.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className={getPerformanceColor(vendor.performance)}>
                      {vendor.performance}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Spent</div>
                      <div className="font-semibold">{formatINRForDisplay(vendor.totalSpent)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Credit Limit</div>
                      <div className="font-semibold">{formatINRForDisplay(vendor.creditLimit)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Outstanding</div>
                      <div className="font-semibold text-warning">{formatINRForDisplay(vendor.outstanding)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Utilization</div>
                      <div className="font-semibold">
                        {((vendor.outstanding / vendor.creditLimit) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    View History
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
