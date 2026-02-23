'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileText, QrCode, Truck, ExternalLink } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function EInvoicingPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('finance')

  const { data, isLoading } = useQuery({
    queryKey: ['finance-e-invoice', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/e-invoice?limit=50', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const invoices = data?.invoices ?? []

  if (!moduleConfig) return <div>Module configuration not found</div>

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="E-Invoicing & E-Way Bill"
        moduleIcon={<QrCode className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="IRN and E-Way Bill for GST compliance (turnover &gt; ₹5 Cr)"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                E-Invoice (IRN)
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Invoice Reference Number from GST portal. Mandatory for B2B above threshold.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate IRN via NIC e-invoice API or GST portal. QR code can be generated after IRN.
              </p>
              <a href="https://einv-apisandbox.nic.in" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  E-Invoice Sandbox
                </Button>
              </a>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                E-Way Bill
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Required for movement of goods when value exceeds ₹50,000.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate e-way bill from ewaybillgst.gov.in. Link to invoice after generation.
              </p>
              <a href="https://ewaybillgst.gov.in" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  E-Way Bill Portal
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices – IRN / E-Way status
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Generate IRN and E-Way Bill from invoice view when integration is enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Invoice</TableHead>
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">Customer</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Total</TableHead>
                      <TableHead className="dark:text-gray-300">IRN</TableHead>
                      <TableHead className="dark:text-gray-300">E-Way Bill</TableHead>
                      <TableHead className="dark:text-gray-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-200">
                          <Link href={`/finance/${tenantId}/Invoices/${inv.id}`} className="text-primary hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="dark:text-gray-200">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{inv.customerName ?? '-'}</TableCell>
                        <TableCell className="dark:text-gray-200 text-right">{formatINRForDisplay(inv.total)}</TableCell>
                        <TableCell className="dark:text-gray-200">{inv.irnNumber ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{inv.ewayBillNumber ?? '—'}</TableCell>
                        <TableCell>
                          <Link href={`/finance/${tenantId}/Invoices/${inv.id}`}>
                            <Button variant="ghost" size="sm" className="dark:text-gray-300">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
