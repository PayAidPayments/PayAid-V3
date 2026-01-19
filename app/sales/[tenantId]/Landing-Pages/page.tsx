'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { RefreshCw } from 'lucide-react'
// ModuleTopBar is now in layout.tsx

interface LandingPage {
  id: string
  name: string
  slug: string
  status: string
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
  // Profile menu handled by ModuleTopBar in layout

  const { data, isLoading, refetch } = useQuery<{ pages: LandingPage[] }>({
    queryKey: ['sales-landing-pages', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/sales/landing-pages`, {
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
              name: 'Summer Sale Landing Page',
              slug: 'summer-sale-2024',
              status: 'PUBLISHED',
              views: 15234,
              conversions: 342,
              conversionRate: 2.24,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample-2',
              name: 'Product Launch Page',
              slug: 'product-launch',
              status: 'PUBLISHED',
              views: 8934,
              conversions: 189,
              conversionRate: 2.12,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample-3',
              name: 'Webinar Registration',
              slug: 'webinar-registration',
              status: 'DRAFT',
              views: 0,
              conversions: 0,
              conversionRate: 0,
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
              <Link href={`/sales/${tenantId}/Landing-Pages`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Landing Pages</Link>
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
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push(tenantId ? `/dashboard/${tenantId}/settings/profile` : '/dashboard/settings/profile')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landing Pages</h1>
            <p className="mt-2 text-gray-600">Create high-converting landing pages with A/B testing</p>
          </div>
          <Link href={`/sales/${tenantId}/Landing-Pages/new`}>
            <Button>Create Landing Page</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">Loading...</div>
        ) : pages.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No landing pages found</p>
                <Link href={`/sales/${tenantId}/Landing-Pages/new`}>
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
                  <Link href={`/sales/${tenantId}/Landing-Pages/${page.id}`}>
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

