'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default function AdvancesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('finance')

  const { data, isLoading } = useQuery({
    queryKey: ['finance-advances', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/advances?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const advances = data?.advances ?? []
  const summary = data?.summary ?? { totalAmount: 0, totalAdjusted: 0, totalBalance: 0 }
  const toVendor = advances.filter((a: any) => a.type === 'TO_VENDOR')
  const fromCustomer = advances.filter((a: any) => a.type === 'FROM_CUSTOMER')

  if (!moduleConfig) return <div>Module configuration not found</div>

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Advance Payments & Receipts"
        moduleIcon={<Wallet className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Track advances to vendors and from customers"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total advance balance</p>
                  <p className="text-2xl font-semibold dark:text-gray-100">
                    {formatINRForDisplay(summary.totalBalance)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">To vendors</p>
                  <p className="text-2xl font-semibold dark:text-gray-100">
                    {formatINRForDisplay(toVendor.reduce((s: number, a: any) => s + (a.amount - a.adjustedAmount), 0))}
                  </p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">From customers</p>
                  <p className="text-2xl font-semibold dark:text-gray-100">
                    {formatINRForDisplay(fromCustomer.reduce((s: number, a: any) => s + (a.amount - a.adjustedAmount), 0))}
                  </p>
                </div>
                <ArrowDownLeft className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">All advances</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Create advances when you pay a vendor in advance or receive advance from a customer. Adjust against invoices when they are raised or cleared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Link href={`/finance/${tenantId}/Advances/new`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New advance
                </Button>
              </Link>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading...</p>
            ) : advances.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No advances yet. Create one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Type</TableHead>
                      <TableHead className="dark:text-gray-300">Ref</TableHead>
                      <TableHead className="dark:text-gray-300">Amount</TableHead>
                      <TableHead className="dark:text-gray-300">Adjusted</TableHead>
                      <TableHead className="dark:text-gray-300">Balance</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advances.map((a: any) => (
                      <TableRow key={a.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-200">
                          {a.type === 'TO_VENDOR' ? 'To vendor' : 'From customer'}
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{a.referenceNumber ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{formatINRForDisplay(a.amount)}</TableCell>
                        <TableCell className="dark:text-gray-200">{formatINRForDisplay(a.adjustedAmount)}</TableCell>
                        <TableCell className="dark:text-gray-200 font-medium">{formatINRForDisplay(a.balance)}</TableCell>
                        <TableCell className="dark:text-gray-200">{a.status}</TableCell>
                        <TableCell className="dark:text-gray-200">
                          {new Date(a.createdAt).toLocaleDateString('en-IN')}
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
