'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { ExternalLink, Download, Database, FileText } from 'lucide-react'

export default function TallyExportPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('finance')
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const downloadCoACsv = () => {
    const url = `${baseUrl}/api/finance/tally/export/coa?format=csv`
    window.open(url, '_blank')
  }
  const downloadCoAJson = () => {
    const url = `${baseUrl}/api/finance/tally/export/coa?format=json`
    window.open(url, '_blank')
  }
  const downloadTxnsCsv = () => {
    const url = `${baseUrl}/api/finance/tally/export/transactions?format=csv&fromDate=${fromDate}&toDate=${toDate}`
    window.open(url, '_blank')
  }
  const downloadTxnsJson = () => {
    const url = `${baseUrl}/api/finance/tally/export/transactions?format=json&fromDate=${fromDate}&toDate=${toDate}`
    window.open(url, '_blank')
  }

  if (!moduleConfig) return <div>Module configuration not found</div>

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Tally Export"
        moduleIcon={<ExternalLink className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Export Chart of Accounts and transactions for Tally"
      />

      <div className="p-6 space-y-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Chart of Accounts
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Export your CoA as CSV or JSON for import into Tally. Map account types in Tally after import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadCoACsv} className="dark:border-gray-600 dark:text-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Download CoA (CSV)
              </Button>
              <Button variant="outline" onClick={downloadCoAJson} className="dark:border-gray-600 dark:text-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Download CoA (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Posted transactions
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Export posted ledger transactions for a date range. Use in Tally as journal/contra entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-40 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-40 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadTxnsCsv} className="dark:border-gray-600 dark:text-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Download transactions (CSV)
              </Button>
              <Button variant="outline" onClick={downloadTxnsJson} className="dark:border-gray-600 dark:text-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Download transactions (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/finance/${tenantId}/Accounting`} className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Accounting
          </Link>
          {' · '}
          HR payroll can be exported to Tally from Statutory Compliance (Export to Tally).
        </p>
      </div>
    </div>
  )
}
