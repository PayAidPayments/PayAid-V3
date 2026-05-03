'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  RefreshCw,
  Package,
  MapPin,
  Bell,
  CheckCircle2,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface ReorderTrigger {
  id: string
  product_id: string
  product_name: string
  sku: string
  location_id: string
  location_name: string
  quantity_on_hand: number
  reserved: number
  available: number
  reorder_level: number
  deficit: number
  urgency: 'critical' | 'low' | 'normal'
  estimated_reorder_value: number
}

interface ReorderData {
  triggers: ReorderTrigger[]
  total: number
  has_critical: boolean
  generated_at: string
}

type UrgencyFilter = 'all' | 'critical' | 'low'

function urgencyBadgeClass(urgency: string) {
  if (urgency === 'critical') return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
}

function urgencyBorderClass(urgency: string) {
  if (urgency === 'critical') return 'border-red-400 dark:border-red-700'
  return 'border-amber-400 dark:border-amber-700'
}

export default function StockAlertsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()

  const [data, setData] = useState<ReorderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<UrgencyFilter>('all')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveQtys, setApproveQtys] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchAlerts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/inventory/reorder-triggers?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch reorder triggers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAlerts()
    setRefreshing(false)
  }

  const handleApprove = async (trigger: ReorderTrigger) => {
    const qty = approveQtys[trigger.id] ?? trigger.deficit
    if (!qty || qty <= 0) {
      window.alert('Please enter a valid quantity to order.')
      return
    }
    try {
      setApprovingId(trigger.id)
      const res = await fetch(`/api/v1/inventory/reorder-triggers/${trigger.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_to_order: qty }),
      })
      if (res.ok) {
        const json = await res.json()
        window.alert(
          `Reorder approved!\nProduct: ${trigger.product_name}\nQty: ${qty} units${
            json.po_draft ? `\nDraft PO created: ${json.po_draft.po_number}` : ''
          }`,
        )
        await fetchAlerts()
      } else {
        const err = await res.json().catch(() => ({}))
        window.alert(`Approval failed: ${err.error ?? 'Unknown error'}`)
      }
    } catch (e) {
      console.error('Approve error:', e)
      window.alert('Failed to submit approval. Please try again.')
    } finally {
      setApprovingId(null)
    }
  }

  const triggers = data?.triggers ?? []
  const filtered = triggers.filter((t) => filter === 'all' || t.urgency === filter)

  const counts = {
    all: triggers.length,
    critical: triggers.filter((t) => t.urgency === 'critical').length,
    low: triggers.filter((t) => t.urgency === 'low').length,
  }

  if (loading) {
    return <PageLoading message="Loading stock alerts..." fullScreen={false} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Stock Alerts</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Items below their reorder threshold — approve reorders directly from here
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{counts.all}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-red-300 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{counts.critical}</div>
            <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">Out of stock or ≤25% of threshold</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-amber-300 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.low}</div>
            <p className="text-xs text-amber-500 dark:text-amber-500 mt-0.5">Between 25–50% of threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'critical', 'low'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? 'bg-gradient-to-r from-[#53328A] to-[#6B4BA1] text-white'
                : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          >
            {f === 'all' ? 'All' : f === 'critical' ? '⚠ Critical' : 'Low Stock'} ({counts[f]})
          </Button>
        ))}
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {filter === 'all' ? 'No Stock Alerts' : `No ${filter === 'critical' ? 'Critical' : 'Low Stock'} Alerts`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All products are above their reorder thresholds.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((trigger) => (
            <Card
              key={trigger.id}
              className={`dark:bg-gray-800 dark:border-gray-700 border-l-4 ${urgencyBorderClass(trigger.urgency)}`}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        trigger.urgency === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/40'
                          : 'bg-amber-100 dark:bg-amber-900/40'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-5 h-5 ${
                          trigger.urgency === 'critical'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {trigger.product_name}
                        </h3>
                        <Badge className={urgencyBadgeClass(trigger.urgency)}>
                          {trigger.urgency === 'critical' ? '⚠ Critical' : 'Low Stock'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" /> SKU: {trigger.sku}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {trigger.location_name}
                        </div>
                        <div>
                          On hand:{' '}
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {trigger.quantity_on_hand}
                          </span>
                          {' / '}
                          Threshold: {trigger.reorder_level}
                        </div>
                        <div>
                          Deficit:{' '}
                          <span className="font-semibold">{trigger.deficit} units</span>
                          {' · '}
                          Est. {formatINRForDisplay(trigger.estimated_reorder_value)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={1}
                      defaultValue={trigger.deficit}
                      onChange={(e) =>
                        setApproveQtys((prev) => ({
                          ...prev,
                          [trigger.id]: Math.max(1, parseInt(e.target.value) || trigger.deficit),
                        }))
                      }
                      className="w-20 text-sm px-2 py-1.5 rounded-lg border border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      title="Quantity to order"
                      placeholder="Qty"
                    />
                    <Button
                      size="sm"
                      disabled={approvingId === trigger.id}
                      onClick={() => handleApprove(trigger)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                      title={approvingId === trigger.id ? 'Approving…' : 'Approve reorder'}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                      {approvingId === trigger.id ? 'Approving…' : 'Approve Reorder'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {data && (
            <p className="text-xs text-slate-400 dark:text-gray-500 text-right">
              Generated {new Date(data.generated_at).toLocaleString()} · {data.total} triggers total
            </p>
          )}
        </div>
      )}
    </div>
  )
}
