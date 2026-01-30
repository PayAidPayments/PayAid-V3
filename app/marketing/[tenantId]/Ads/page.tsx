'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Megaphone, 
  Plus, 
  TrendingUp, 
  IndianRupee,
  Eye,
  MousePointerClick,
  Users,
  BarChart3,
  Settings,
  Play,
  Pause
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface AdCampaign {
  id: string
  name: string
  platform: 'google' | 'facebook' | 'linkedin' | 'instagram'
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
  startDate: string
  endDate?: string
}

export default function AdsManagementPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [tenantId, token])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      if (!token) return

      const response = await fetch('/api/marketing/ads/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else {
        // Use sample data for demo
        setCampaigns([
          {
            id: 'ad-1',
            name: 'Q1 Product Launch',
            platform: 'google',
            status: 'active',
            budget: 50000,
            spent: 12500,
            impressions: 125000,
            clicks: 2500,
            conversions: 125,
            ctr: 2.0,
            cpc: 5.0,
            roas: 4.2,
            startDate: new Date().toISOString(),
          },
          {
            id: 'ad-2',
            name: 'Facebook Brand Awareness',
            platform: 'facebook',
            status: 'active',
            budget: 30000,
            spent: 8500,
            impressions: 200000,
            clicks: 3200,
            conversions: 80,
            ctr: 1.6,
            cpc: 2.65,
            roas: 3.8,
            startDate: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'google':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'facebook':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'linkedin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'instagram':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return <PageLoading message="Loading ad campaigns..." fullScreen={false} />
  }

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const avgCTR = campaigns.length > 0
    ? (campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ads Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Plan, launch, and optimize paid campaigns across Google, Facebook, LinkedIn, and more
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatINRForDisplay(totalSpent)}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Impressions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalImpressions.toLocaleString('en-IN')}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Clicks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalClicks.toLocaleString('en-IN')}
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg CTR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {avgCTR.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Campaigns</CardTitle>
          <CardDescription>Manage your paid advertising campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{campaign.name}</h3>
                        <Badge className={getPlatformColor(campaign.platform)}>
                          {campaign.platform}
                        </Badge>
                        <Badge
                          className={
                            campaign.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : campaign.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Budget</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatINRForDisplay(campaign.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Spent</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatINRForDisplay(campaign.spent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">CTR</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {campaign.ctr.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">ROAS</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {campaign.roas.toFixed(2)}x
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'active' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No ad campaigns created yet. Create your first paid advertising campaign.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create Ad Campaign</CardTitle>
              <CardDescription>Set up a new paid advertising campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Name
                </label>
                <Input placeholder="e.g., Q1 Product Launch" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg">
                  <option value="google">Google Ads</option>
                  <option value="facebook">Facebook Ads</option>
                  <option value="linkedin">LinkedIn Ads</option>
                  <option value="instagram">Instagram Ads</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget (₹)
                </label>
                <Input type="number" placeholder="10000" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
