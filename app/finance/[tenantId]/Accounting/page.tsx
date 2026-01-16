'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function FinanceAccountingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accounting</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage expenses and financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={`/finance/${tenantId}/Accounting/Expenses`}>
          <Card className="transition-all hover:shadow-md cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💸</span>
                <div>
                  <CardTitle className="dark:text-gray-100">Expenses</CardTitle>
                  <CardDescription className="dark:text-gray-400">Track and manage business expenses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Record expenses, categorize them, and track spending across your business.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/finance/${tenantId}/Accounting/Reports`}>
          <Card className="transition-all hover:shadow-md cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <CardTitle className="dark:text-gray-100">Financial Reports</CardTitle>
                  <CardDescription className="dark:text-gray-400">View P&L, Balance Sheet, and more</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate profit & loss statements, balance sheets, and financial insights.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Link href={`/finance/${tenantId}/Accounting/Expenses/New`}>
              <Button className="w-full justify-start dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Record New Expense</Button>
            </Link>
            <Link href={`/finance/${tenantId}/Accounting/Reports`}>
              <Button variant="outline" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">View Financial Reports</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
