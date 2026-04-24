'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { RefreshCw } from 'lucide-react'
// ModuleTopBar is now in layout.tsx

interface LandingPage {
  id: string
  name: string
  slug: string
  status: string
  pageType?: string
  views: number
  conversions: number
  conversionRate?: number
  createdAt: string
}

export default function SalesLandingPagesPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'lead_capture' | 'offer' | 'appointment_booking'>(
    'ALL'
  )
  // Profile menu handled by ModuleTopBar in layout

  const { data, isLoading, refetch } = useQuery<{ pages: LandingPage[] }>({
    queryKey: ['sales-pages', tenantId, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (typeFilter !== 'ALL') params.set('pageType', typeFilter)

      const response = await fetch(`/api/sales-pages?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch sales pages')
      return response.json()
    },
    enabled: Boolean(token),
  })

  const pages = data?.pages || []
  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const response = await fetch(`/api/sales-pages/${id}/${publish ? 'publish' : 'unpublish'}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error(`Failed to ${publish ? 'publish' : 'unpublish'} page`)
      return response.json()
    },
    onSuccess: () => refetch(),
  })
  const busyPageId = useMemo(
    () => (publishMutation.isPending ? (publishMutation.variables?.id ?? null) : null),
    [publishMutation.isPending, publishMutation.variables]
  )

  // Profile menu and logout handled by ModuleTopBar in layout

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/sales/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/sales/${tenantId}/Sales-Pages`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Sales Pages</Link>
              <Link href={`/sales/${tenantId}/Checkout-Pages`} className="text-gray-600 hover:text-gray-900 transition-colors">Checkout Pages</Link>
              <Link href={`/sales/${tenantId}/Orders`} className="text-gray-600 hover:text-gray-900 transition-colors">Orders</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <ModuleSwitcher currentModule="sales" />
            {/* Profile menu handled by ModuleTopBar in layout */}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landing Pages</h1>
            <p className="mt-2 text-gray-600">Create high-converting landing pages with A/B testing</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
              aria-label="Filter by page type"
            >
              <option value="ALL">All types</option>
              <option value="lead_capture">Lead Capture</option>
              <option value="offer">Offer</option>
              <option value="appointment_booking">Booking</option>
            </select>
            <Link href={`/sales/${tenantId}/Sales-Pages/new`}>
              <Button>Create Landing Page</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">Loading...</div>
        ) : pages.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No sales pages found</p>
                <Link href={`/sales/${tenantId}/Sales-Pages/new`}>
                  <Button>Create Your First Landing Page</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle>{page.name}</CardTitle>
                  <CardDescription>/{page.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        page.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Views:</span>
                      <span className="font-semibold">{page.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Conversions:</span>
                      <span className="font-semibold">{page.conversions.toLocaleString()}</span>
                    </div>
                    {page.conversionRate != null && page.conversionRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Conversion Rate:</span>
                        <span className="font-semibold text-green-600">
                          {Number(page.conversionRate).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyPageId === page.id}
                      onClick={() =>
                        publishMutation.mutate({ id: page.id, publish: page.status !== 'PUBLISHED' })
                      }
                    >
                      {page.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                  <Link href={`/sales/${tenantId}/Sales-Pages/${page.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Edit Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

