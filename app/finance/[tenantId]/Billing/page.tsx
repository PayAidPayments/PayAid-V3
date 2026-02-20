'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import Link from 'next/link'
import { PageLoading } from '@/components/ui/loading'
import { formatINRStandard, formatINRForDisplay } from '@/lib/utils/formatINR'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { CreditCard, IndianRupee, Package, CheckCircle2 } from 'lucide-react'

interface Subscription {
  id: string
  modules: string[]
  tier: string
  monthlyPrice: number
  billingCycleStart: string
  billingCycleEnd: string
  status: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  paidAt?: string
  modules: string[]
}

export default function FinanceBillingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    fetch('/api/user/licenses', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription) {
          setSubscription({
            id: data.subscription.id,
            modules: data.subscription.modules,
            tier: data.subscription.tier,
            monthlyPrice: data.subscription.monthlyPrice,
            billingCycleStart: data.subscription.billingCycleStart,
            billingCycleEnd: data.subscription.billingCycleEnd,
            status: data.subscription.status,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const moduleIcons: Record<string, string> = {
    crm: '👥',
    invoicing: '📄',
    accounting: '💰',
    hr: '👔',
    whatsapp: '💬',
    analytics: '📊',
  }

  const moduleConfig = getModuleConfig('finance')

  const heroMetrics = [
    {
      label: 'Current Plan',
      value: subscription?.tier?.toUpperCase() || 'FREE',
      icon: <Package className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Monthly Price',
      value: subscription ? formatINRForDisplay(subscription.monthlyPrice) : '₹0',
      icon: <IndianRupee className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Licensed Modules',
      value: subscription?.modules?.length?.toString() || '0',
      icon: <CheckCircle2 className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Payment History',
      value: orders.length.toString(),
      icon: <CreditCard className="w-5 h-5" />,
      href: '#',
    },
  ]

  if (loading) {
    return <PageLoading message="Loading billing information..." fullScreen={false} />
  }

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Billing & Subscription"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <GlassCard>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Current Plan</h2>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">{subscription.tier}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatINRStandard(subscription.monthlyPrice)}/month
                  </p>
                </div>
                <Link
                  href="/app-store"
                  className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  Upgrade Plan
                </Link>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Licensed Modules:</p>
                <div className="flex flex-wrap gap-2">
                  {subscription.modules.map((moduleId) => (
                    <span
                      key={moduleId}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                    >
                      <span>{moduleIcons[moduleId] || '📦'}</span>
                      <span className="uppercase">{moduleId}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
                <span>
                  Billing Cycle: {new Date(subscription.billingCycleStart).toLocaleDateString()} - {new Date(subscription.billingCycleEnd).toLocaleDateString()}
                </span>
                <span className="capitalize">Status: {subscription.status}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No active subscription</p>
              <Link
                href="/app-store"
                className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition inline-block"
              >
                Browse Modules
              </Link>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Payment History</h2>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 text-gray-700 dark:text-gray-300">Order #</th>
                    <th className="text-left py-2 text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-2 text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="text-left py-2 text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-2 text-gray-700 dark:text-gray-300">Modules</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-gray-100 font-medium">{order.orderNumber}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-gray-900 dark:text-gray-100">
                        {formatINRStandard(order.total)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          order.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {order.modules.slice(0, 3).map((moduleId) => (
                            <span key={moduleId} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                              {moduleId.toUpperCase()}
                            </span>
                          ))}
                          {order.modules.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">+{order.modules.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No payment history yet</p>
          )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
