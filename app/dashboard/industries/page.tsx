'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const INDUSTRY_ROUTES: Record<string, { name: string; routes: { path: string; label: string; icon: string }[] }> = {
  restaurant: {
    name: 'Restaurant',
    routes: [
      { path: '/dashboard/industries/restaurant/orders', label: 'Orders', icon: '📋' },
      { path: '/dashboard/industries/restaurant/menu', label: 'Menu', icon: '🍽️' },
      { path: '/dashboard/industries/restaurant/kitchen', label: 'Kitchen Display', icon: '👨‍🍳' },
    ],
  },
  retail: {
    name: 'Retail',
    routes: [
      { path: '/dashboard/industries/retail/products', label: 'Products', icon: '🛒' },
      { path: '/dashboard/industries/retail/pos', label: 'POS Terminal', icon: '💳' },
      { path: '/dashboard/industries/retail/inventory', label: 'Inventory', icon: '📦' },
    ],
  },
  manufacturing: {
    name: 'Manufacturing',
    routes: [
      { path: '/dashboard/industries/manufacturing/production', label: 'Production', icon: '🏭' },
      { path: '/dashboard/industries/manufacturing/bom', label: 'BOM Management', icon: '📋' },
      { path: '/dashboard/industries/manufacturing/vendors', label: 'Vendors', icon: '🤝' },
    ],
  },
  real_estate: {
    name: 'Real Estate',
    routes: [
      { path: '/dashboard/industries/real_estate/properties', label: 'Properties', icon: '🏠' },
      { path: '/dashboard/industries/real_estate/advances', label: 'Advances', icon: '💰' },
      { path: '/dashboard/industries/real_estate/projects', label: 'Projects', icon: '📊' },
    ],
  },
  healthcare: {
    name: 'Healthcare',
    routes: [
      { path: '/dashboard/industries/healthcare/patients', label: 'Patients', icon: '👥' },
      { path: '/dashboard/industries/healthcare/appointments', label: 'Appointments', icon: '📅' },
      { path: '/dashboard/industries/healthcare/prescriptions', label: 'Prescriptions', icon: '💊' },
    ],
  },
}

export default function IndustriesPage() {
  const { data, isLoading } = useQuery<{
    industry: string
    industrySubType: string
    enabledFeatures: { name: string }[]
  }>({
    queryKey: ['industry-info'],
    queryFn: async () => {
      // First get the tenant's industry
      const tenantResponse = await apiRequest('/api/auth/me')
      if (!tenantResponse.ok) throw new Error('Failed to get user info')
      const user = await tenantResponse.json()
      
      // Then get industry info
      if (!user.tenant?.industry) {
        return { industry: null, industrySubType: null, enabledFeatures: [] }
      }
      
      const response = await apiRequest(`/api/industries/${user.tenant.industry}`)
      if (!response.ok) throw new Error('Failed to get industry info')
      return response.json()
    },
  })

  const industry = data?.industry
  const routes = industry ? INDUSTRY_ROUTES[industry] : null

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!industry) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Industry Modules</h1>
          <p className="mt-2 text-gray-600">
            Select your industry to enable industry-specific features
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-gray-600 mb-4">
              No industry selected yet
            </p>
            <Link href="/dashboard/setup/industry">
              <Button size="lg">Select Your Industry</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {routes?.name || industry} Industry
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your {routes?.name.toLowerCase() || industry} business operations
        </p>
      </div>

      {/* Enabled Features */}
      <Card>
        <CardHeader>
          <CardTitle>Enabled Features</CardTitle>
          <CardDescription>
            Industry-specific features that are currently active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data?.enabledFeatures.map((feature) => (
              <span
                key={feature.name}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {feature.name.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Routes */}
      {routes && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{route.icon}</span>
                      <CardTitle className="text-lg">{route.label}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Change Industry */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Want to change your industry?</p>
              <p className="text-sm text-gray-600 mt-1">
                You can update your industry settings anytime
              </p>
            </div>
            <Link href="/dashboard/setup/industry">
              <Button variant="outline">Change Industry</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
