'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModuleGate } from '@/components/modules/ModuleGate'
import { useAuthStore } from '@/lib/stores/auth'

interface GSTR3BData {
  filingPeriod: string
  outwardSupplies: {
    taxable: number
    gst: number
  }
  inwardSupplies: {
    taxable: number
    gst: number
  }
  netGSTPayable: number
  inputTaxCredit: number
  summary: {
    totalSales: number
    totalPurchases: number
    gstPayable: number
  }
}

export default function GSTR3BPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { token } = useAuthStore()

  const { data, isLoading, refetch } = useQuery<GSTR3BData>({
    queryKey: ['gstr-3b', month, year],
    queryFn: async () => {
      const response = await fetch(`/api/gst/gstr-3b?month=${month}&year=${year}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch GSTR-3B')
      return response.json()
    },
  })

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const url = `/api/gst/gstr-3b/export?month=${month}&year=${year}&format=${format}`
      const response = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      
      if (!response.ok) {
        if (response.status === 501) {
          alert('PDF export is not yet implemented. Please use Excel export.')
          return
        }
        const error = await response.json()
        throw new Error(error.error || 'Failed to export')
      }
      
      if (format === 'excel') {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `GSTR-3B-${month}-${year}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      } else {
        alert('PDF export is not yet implemented. Please use Excel export.')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export GSTR-3B')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const gstr3b = data

  return (
    <ModuleGate module="finance">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GSTR-3B Report</h1>
          <p className="mt-2 text-gray-600">Summary Return - Monthly GST Filing</p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="h-10 rounded-md border border-gray-300 px-3"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('en-IN', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="h-10 w-24 rounded-md border border-gray-300 px-3"
            min="2020"
            max="2100"
          />
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{((gstr3b?.summary.totalSales || 0) / 100000).toFixed(2)}L
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{((gstr3b?.summary.totalPurchases || 0) / 100000).toFixed(2)}L
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Input Tax Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{((gstr3b?.inputTaxCredit || 0) / 100000).toFixed(2)}L
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">GST Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{((gstr3b?.summary.gstPayable || 0) / 100000).toFixed(2)}L
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outward Supplies */}
      <Card>
        <CardHeader>
          <CardTitle>Outward Supplies (Sales)</CardTitle>
          <CardDescription>Taxable supplies made during the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">Taxable Value</div>
              <div className="text-2xl font-bold">
                ₹{((gstr3b?.outwardSupplies.taxable || 0) / 100000).toFixed(2)}L
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">GST Collected</div>
              <div className="text-2xl font-bold">
                ₹{((gstr3b?.outwardSupplies.gst || 0) / 100000).toFixed(2)}L
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inward Supplies */}
      <Card>
        <CardHeader>
          <CardTitle>Inward Supplies (Purchases)</CardTitle>
          <CardDescription>Taxable supplies received during the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">Taxable Value</div>
              <div className="text-2xl font-bold">
                ₹{((gstr3b?.inwardSupplies.taxable || 0) / 100000).toFixed(2)}L
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Input Tax Credit (ITC)</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{((gstr3b?.inwardSupplies.gst || 0) / 100000).toFixed(2)}L
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net GST Payable */}
      <Card>
        <CardHeader>
          <CardTitle>Net GST Payable</CardTitle>
          <CardDescription>
            GST Collected - Input Tax Credit = Net Payable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg">GST Collected (Outward Supplies)</div>
              <div className="text-lg font-semibold">
                ₹{((gstr3b?.outwardSupplies.gst || 0) / 100000).toFixed(2)}L
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg">Input Tax Credit (Inward Supplies)</div>
              <div className="text-lg font-semibold text-green-600">
                - ₹{((gstr3b?.inwardSupplies.gst || 0) / 100000).toFixed(2)}L
              </div>
            </div>
            <div className="border-t pt-4 flex items-center justify-between">
              <div className="text-xl font-bold">Net GST Payable</div>
              <div className="text-2xl font-bold text-red-600">
                ₹{((gstr3b?.netGSTPayable || 0) / 100000).toFixed(2)}L
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Filing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              • GSTR-3B is a monthly summary return to be filed by the 20th of the following month
            </p>
            <p>
              • This report shows the summary of outward supplies, inward supplies, and net GST
              payable
            </p>
            <p>
              • Use this data to file your GSTR-3B on the GST Portal (www.gst.gov.in)
            </p>
            <p>• Export this report and upload it to the GST Portal for easy filing</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </ModuleGate>
  )
}
