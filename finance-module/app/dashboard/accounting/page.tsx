import { ModuleGate } from '@/components/modules/ModuleGate'
'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function AccountingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <p className="mt-2 text-gray-600">Manage expenses and financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/accounting/expenses">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💸</span>
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track and manage business expenses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Record expenses, categorize them, and track spending across your business.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/accounting/reports">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>View P&L, Balance Sheet, and more</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Generate profit & loss statements, balance sheets, and financial insights.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Link href="/dashboard/accounting/expenses/new">
              <Button className="w-full justify-start">Record New Expense</Button>
            </Link>
            <Link href="/dashboard/accounting/reports">
              <Button variant="outline" className="w-full justify-start">View Financial Reports</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export default function Page() {
  return (
    <ModuleGate module="finance">
      <AccountingPage />
    </ModuleGate>
  )
}
