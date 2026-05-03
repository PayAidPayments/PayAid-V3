'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus,
  DollarSign,
  TrendingUp,
  Building2,
  Settings
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function ResellersPage() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<any[]>([])

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      // Note: API endpoint needs ResellerPartner model in schema
      // For now, showing placeholder UI
      setPartners([])
    } catch (error) {
      console.error('Failed to fetch partners:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading reseller partners..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reseller Program</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage partner relationships and revenue sharing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{partners.length}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {partners.filter(p => p.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {partners.reduce((sum, p) => sum + (p._count?.customers || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹0</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Partners List */}
        {partners.length === 0 ? (
          <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
            <CardContent>
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Partners Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start building your reseller network by adding your first partner
              </p>
              <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <Card key={partner.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-gray-100">{partner.companyName}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">{partner.name}</CardDescription>
                    </div>
                    <Badge
                      variant={partner.status === 'active' ? 'default' : 'secondary'}
                      className={partner.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                    >
                      {partner.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Commission Rate</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{partner.commissionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Customers</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{partner._count?.customers || 0}</span>
                    </div>
                    {partner.whiteLabelEnabled && (
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        White Label Enabled
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

