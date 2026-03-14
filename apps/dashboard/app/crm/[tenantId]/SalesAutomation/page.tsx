'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Zap, 
  Mail, 
  Phone, 
  Users, 
  TrendingUp, 
  Play, 
  Pause, 
  Settings,
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface AIProspect {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'pending' | 'contacted' | 'qualified' | 'converted' | 'rejected'
  intentScore: number
  lastContacted?: string
  nextFollowUp?: string
  contactCount: number
  source: string
}

interface OutreachCampaign {
  id: string
  name: string
  type: 'cold-email' | 'cold-call' | 'linkedin' | 'multi-channel'
  status: 'draft' | 'active' | 'paused' | 'completed'
  prospectsCount: number
  contactedCount: number
  responseRate: number
  conversionRate: number
  createdAt: string
}

export default function SalesAutomationPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [prospects, setProspects] = useState<AIProspect[]>([])
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([])
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'cold-email' as const,
    targetCriteria: '',
  })

  useEffect(() => {
    fetchData()
  }, [tenantId, token])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!token) return

      const [prospectsRes, campaignsRes] = await Promise.all([
        fetch('/api/crm/sales-automation/prospects', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/crm/sales-automation/campaigns', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      if (prospectsRes.ok) {
        const data = await prospectsRes.json()
        setProspects(data.prospects || [])
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      alert('Please provide a campaign name')
      return
    }

    try {
      const response = await fetch('/api/crm/sales-automation/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCampaign),
      })

      if (response.ok) {
        setShowCreateCampaign(false)
        setNewCampaign({ name: '', type: 'cold-email', targetCriteria: '' })
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign')
    }
  }

  if (loading) {
    return <PageLoading message="Loading sales automation..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Sales Automation</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered prospecting, cold outreach, and automated follow-ups
          </p>
        </div>
        <Button
          onClick={() => setShowCreateCampaign(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Prospects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {prospects.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {campaigns.length > 0
                    ? (campaigns.reduce((sum, c) => sum + c.responseRate, 0) / campaigns.length).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {campaigns.length > 0
                    ? (campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Outreach Campaigns</CardTitle>
          <CardDescription>Manage your AI-powered sales campaigns</CardDescription>
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
                        <Badge variant="outline" className="capitalize">{campaign.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Prospects</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {campaign.prospectsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Contacted</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {campaign.contactedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Response Rate</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {campaign.responseRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Conversion</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {campaign.conversionRate.toFixed(1)}%
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
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No campaigns created yet. Create your first AI-powered sales campaign.
              </p>
              <Button
                onClick={() => setShowCreateCampaign(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prospects */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Prospected Leads</CardTitle>
          <CardDescription>Leads identified and qualified by AI</CardDescription>
        </CardHeader>
        <CardContent>
          {prospects.length > 0 ? (
            <div className="space-y-4">
              {prospects.slice(0, 10).map((prospect) => (
                <div
                  key={prospect.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{prospect.name}</h3>
                        <Badge
                          className={
                            prospect.status === 'qualified'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : prospect.status === 'contacted'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }
                        >
                          {prospect.status}
                        </Badge>
                        <Badge variant="outline">Intent: {prospect.intentScore}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>{prospect.email}</p>
                        {prospect.company && <p>Company: {prospect.company}</p>}
                        <p>Source: {prospect.source}</p>
                        <p>Contacts: {prospect.contactCount}</p>
                        {prospect.nextFollowUp && (
                          <p>Next Follow-up: {format(new Date(prospect.nextFollowUp), 'MMM dd, yyyy HH:mm')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No prospects yet. AI will identify and qualify prospects based on your campaigns.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create AI Sales Campaign</CardTitle>
              <CardDescription>Set up automated prospecting and outreach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Name
                </label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Q1 Enterprise Outreach"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Type
                </label>
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
                >
                  <option value="cold-email">Cold Email</option>
                  <option value="cold-call">Cold Call</option>
                  <option value="linkedin">LinkedIn Outreach</option>
                  <option value="multi-channel">Multi-Channel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Criteria
                </label>
                <textarea
                  value={newCampaign.targetCriteria}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetCriteria: e.target.value })}
                  placeholder="e.g., Companies in IT sector, 50-200 employees, based in Mumbai"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateCampaign(false)
                    setNewCampaign({ name: '', type: 'cold-email', targetCriteria: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.name.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
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
