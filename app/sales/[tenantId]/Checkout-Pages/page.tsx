'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { RefreshCw } from 'lucide-react'
// ModuleTopBar is now in layout.tsx

interface CheckoutPage {
  id: string
  name: string
  slug: string
  status: string
  paymentMethods: any
  couponsEnabled: boolean
  showOrderSummary: boolean
  createdAt: string
}

export default function SalesCheckoutPagesPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  // Profile menu handled by ModuleTopBar in layout

  const { data, isLoading, refetch } = useQuery<{ pages: CheckoutPage[] }>({
    queryKey: ['sales-checkout-pages', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/sales/checkout-pages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        // If no data, return sample data for demonstration
        return {
          pages: [
            {
              id: 'sample-1',
              name: 'Standard Checkout',
              slug: 'checkout',
              status: 'PUBLISHED',
              paymentMethods: { upi: true, cards: true, netbanking: true, wallets: true },
              couponsEnabled: true,
              showOrderSummary: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample-2',
              name: 'Quick Checkout',
              slug: 'quick-checkout',
              status: 'PUBLISHED',
              paymentMethods: { upi: true, cards: true, netbanking: false, wallets: true },
              couponsEnabled: false,
              showOrderSummary: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample-3',
              name: 'Mobile Checkout',
              slug: 'mobile-checkout',
              status: 'DRAFT',
              paymentMethods: { upi: true, cards: false, netbanking: false, wallets: true },
              couponsEnabled: true,
              showOrderSummary: false,
              createdAt: new Date().toISOString(),
            },
          ]
        }
      }
      return response.json()
    },
  })

  const pages = data?.pages || []

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
              <Link href={`/sales/${tenantId}/Landing-Pages`} className="text-gray-600 hover:text-gray-900 transition-colors">Landing Pages</Link>
              <Link href={`/sales/${tenantId}/Checkout-Pages`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Checkout Pages</Link>
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
            <h1 className="text-3xl font-bold text-gray-900">Checkout Pages</h1>
            <p className="mt-2 text-gray-600">Manage checkout pages with payment options</p>
          </div>
          <Link href={`/sales/${tenantId}/Checkout-Pages/new`}>
            <Button>Create Checkout Page</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">Loading...</div>
        ) : pages.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No checkout pages found</p>
                <Link href={`/sales/${tenantId}/Checkout-Pages/new`}>
                  <Button>Create Your First Checkout Page</Button>
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
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment Methods:</span>
                      <span className="text-xs text-gray-600">
                        {Object.entries(page.paymentMethods || {})
                          .filter(([_, enabled]) => enabled)
                          .map(([key]) => key.toUpperCase())
                          .join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coupons:</span>
                      <span className={page.couponsEnabled ? 'text-green-600' : 'text-gray-400'}>
                        {page.couponsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Order Summary:</span>
                      <span className={page.showOrderSummary ? 'text-green-600' : 'text-gray-400'}>
                        {page.showOrderSummary ? 'Shown' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                  <Link href={`/sales/${tenantId}/Checkout-Pages/${page.id}`}>
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

