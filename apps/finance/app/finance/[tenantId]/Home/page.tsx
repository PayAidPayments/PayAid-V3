'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  FileText,
  IndianRupee,
  Receipt,
  Scale,
  Plus,
  Calculator,
} from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

type FinanceHomeStats = {
  invoiceCount: number
  outstandingAmount: number
  paidThisMonth: number
  overdueCount: number
}

export default function FinanceHomePage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('finance') || getModuleConfig('crm')!
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<FinanceHomeStats>({
    invoiceCount: 0,
    outstandingAmount: 0,
    paidThisMonth: 0,
    overdueCount: 0,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/finance/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          // Honest empty when API not ready
          if (!cancelled) {
            setStats({
              invoiceCount: 0,
              outstandingAmount: 0,
              paidThisMonth: 0,
              overdueCount: 0,
            })
          }
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setStats({
            invoiceCount: Number(data.invoiceCount ?? data.totalInvoices ?? 0),
            outstandingAmount: Number(data.outstandingAmount ?? data.receivables ?? 0),
            paidThisMonth: Number(data.paidThisMonth ?? data.collectedThisMonth ?? 0),
            overdueCount: Number(data.overdueCount ?? data.overdueInvoices ?? 0),
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load finance summary')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) return <DashboardSkeleton />

  const hasData =
    stats.invoiceCount > 0 ||
    stats.outstandingAmount > 0 ||
    stats.paidThisMonth > 0 ||
    stats.overdueCount > 0

  const kpis: DashboardKpi[] = [
    {
      label: 'Invoices',
      value: stats.invoiceCount,
      icon: <FileText className="w-5 h-5" />,
      tone: 'purple',
      href: `/finance/${tenantId}/Invoices`,
    },
    {
      label: 'Outstanding',
      value: formatINRForDisplay(stats.outstandingAmount),
      icon: <IndianRupee className="w-5 h-5" />,
      tone: 'gold',
      href: `/finance/${tenantId}/Invoices`,
    },
    {
      label: 'Collected (period)',
      value: formatINRForDisplay(stats.paidThisMonth),
      icon: <Receipt className="w-5 h-5" />,
      tone: 'success',
      href: `/finance/${tenantId}/Invoices`,
    },
    {
      label: 'Overdue',
      value: stats.overdueCount,
      icon: <Scale className="w-5 h-5" />,
      tone: stats.overdueCount > 0 ? 'error' : 'info',
      href: `/finance/${tenantId}/Invoices`,
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'New invoice',
      href: `/finance/${tenantId}/Invoices/new`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Invoices',
      href: `/finance/${tenantId}/Invoices`,
      variant: 'secondary',
    },
    {
      label: 'GST',
      href: `/finance/${tenantId}/GST`,
      variant: 'secondary',
    },
    {
      label: 'Accounting',
      href: `/finance/${tenantId}/Accounting`,
      icon: <Calculator className="w-4 h-4" />,
      variant: 'secondary',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId="finance"
      title="Finance & Compliance"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      error={error}
      kpis={kpis}
      insight={{
        text: hasData
          ? stats.overdueCount > 0
            ? `${stats.overdueCount} overdue invoice${stats.overdueCount === 1 ? '' : 's'}. Outstanding ${formatINRForDisplay(stats.outstandingAmount)}.`
            : `Receivables look healthy. Outstanding ${formatINRForDisplay(stats.outstandingAmount)}; collected ${formatINRForDisplay(stats.paidThisMonth)} this period.`
          : 'Finance hubs are ready. Create an invoice to populate KPIs — GST and Accounting remain shallow until nested routes are fully ported.',
        status: hasData ? 'ready' : 'unavailable',
      }}
      actions={actions}
      secondaryTitle="Start here"
      secondaryDescription="Primary finance workflows"
      secondary={
        hasData ? (
          <ul className="space-y-2 text-sm">
            <li>
              <Link className="text-[#53328A] hover:underline font-medium" href={`/finance/${tenantId}/Invoices`}>
                Review invoices & receivables
              </Link>
            </li>
            <li>
              <Link className="text-[#53328A] hover:underline font-medium" href={`/finance/${tenantId}/Billing`}>
                Billing & subscription invoices
              </Link>
            </li>
            <li>
              <Link className="text-[#53328A] hover:underline font-medium" href={`/finance/${tenantId}/GST`}>
                GST returns hub
              </Link>
            </li>
            <li>
              <Link className="text-[#53328A] hover:underline font-medium" href={`/finance/${tenantId}/Accounting`}>
                Accounting hub
              </Link>
            </li>
          </ul>
        ) : (
          <DashboardEmptyState
            icon={<FileText />}
            title="No finance activity yet"
            description="Create your first invoice to unlock receivables KPIs. GST and Accounting hubs stay available as shallow navigation."
            actionLabel="Create invoice"
            actionHref={`/finance/${tenantId}/Invoices/new`}
          />
        )
      }
    />
  )
}
