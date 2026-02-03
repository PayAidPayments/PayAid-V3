'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Receipt, FileText, Plus, TrendingUp } from 'lucide-react'

export default function FinanceAccountingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const moduleConfig = getModuleConfig('finance')

  const heroMetrics = [
    {
      label: 'Expenses',
      value: 'Track & Manage',
      icon: Receipt,
      href: `/finance/${tenantId}/Accounting/Expenses`,
    },
    {
      label: 'Reports',
      value: 'P&L & Balance Sheet',
      icon: FileText,
      href: `/finance/${tenantId}/Accounting/Reports`,
    },
    {
      label: 'Quick Action',
      value: 'Record Expense',
      icon: Plus,
      href: `/finance/${tenantId}/Accounting/Expenses/New`,
    },
    {
      label: 'Insights',
      value: 'Financial Analytics',
      icon: TrendingUp,
      href: `/finance/${tenantId}/Accounting/Reports`,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Accounting"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/finance/${tenantId}/Accounting/Expenses`}>
            <GlassCard className="transition-all hover:shadow-lg cursor-pointer">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Receipt className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Expenses</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage business expenses</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record expenses, categorize them, and track spending across your business.
                </p>
              </div>
            </GlassCard>
          </Link>

          <Link href={`/finance/${tenantId}/Accounting/Reports`}>
            <GlassCard className="transition-all hover:shadow-lg cursor-pointer">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Financial Reports</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View P&L, Balance Sheet, and more</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate profit & loss statements, balance sheets, and financial insights.
                </p>
              </div>
            </GlassCard>
          </Link>
        </div>

        <GlassCard>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/finance/${tenantId}/Accounting/Expenses/New`}>
                <Button className="w-full justify-start bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Record New Expense
                </Button>
              </Link>
              <Link href={`/finance/${tenantId}/Accounting/Reports`}>
                <Button variant="outline" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  View Financial Reports
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
