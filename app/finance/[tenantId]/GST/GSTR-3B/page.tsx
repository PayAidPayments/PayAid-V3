'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRStandard } from '@/lib/utils/formatINR'

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

export default function FinanceGSTR3BPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
    return <PageLoading message="Loading GSTR-3B report..." fullScreen={false} />
  }

  const gstr3b = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">GSTR-3B Report</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Summary Return - Monthly GST Filing</p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
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
            className="h-10 w-24 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
            min="2020"
            max="2100"
          />
          <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          <Button variant="outline" onClick={() => handleExport('excel')} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">
              {formatINRStandard((gstr3b?.summary.totalSales || 0) / 1000)}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">
              {formatINRStandard((gstr3b?.summary.totalPurchases || 0) / 1000)}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Input Tax Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatINRStandard((gstr3b?.inputTaxCredit || 0) / 1000)}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">GST Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatINRStandard((gstr3b?.summary.gstPayable || 0) / 1000)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Outward Supplies (Sales)</CardTitle>
          <CardDescription className="dark:text-gray-400">Taxable supplies made during the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taxable Value</div>
              <div className="text-2xl font-bold dark:text-gray-100">
                {formatINRStandard((gstr3b?.outwardSupplies.taxable || 0) / 1000)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">GST Collected</div>
              <div className="text-2xl font-bold dark:text-gray-100">
                {formatINRStandard((gstr3b?.outwardSupplies.gst || 0) / 1000)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Inward Supplies (Purchases)</CardTitle>
          <CardDescription className="dark:text-gray-400">Taxable supplies received during the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taxable Value</div>
              <div className="text-2xl font-bold dark:text-gray-100">
                {formatINRStandard((gstr3b?.inwardSupplies.taxable || 0) / 1000)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Input Tax Credit (ITC)</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatINRStandard((gstr3b?.inwardSupplies.gst || 0) / 1000)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Net GST Payable</CardTitle>
          <CardDescription className="dark:text-gray-400">
            GST Collected - Input Tax Credit = Net Payable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg dark:text-gray-300">GST Collected (Outward Supplies)</div>
              <div className="text-lg font-semibold dark:text-gray-100">
                {formatINRStandard((gstr3b?.outwardSupplies.gst || 0) / 1000)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg dark:text-gray-300">Input Tax Credit (Inward Supplies)</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                - {formatINRStandard((gstr3b?.inwardSupplies.gst || 0) / 1000)}
              </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-4 flex items-center justify-between">
              <div className="text-xl font-bold dark:text-gray-100">Net GST Payable</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatINRStandard((gstr3b?.netGSTPayable || 0) / 1000)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Filing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
  )
}
