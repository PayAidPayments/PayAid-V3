'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Megaphone, 
  Mail, 
  Share2, 
  MessageCircle, 
  TrendingUp, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Brain,
  Zap,
  Target
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ModuleSwitcher } from '@/components/modules/ModuleSwitcher'
// ModuleTopBar is now in layout.tsx
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'

interface MarketingDashboardStats {
  totalCampaigns: number
  activeCampaigns: number
  emailSent: number
  emailSentThisMonth: number
  emailSentLastMonth: number
  emailGrowth: number
  socialPosts: number
  socialPostsThisMonth: number
  whatsappMessages: number
  whatsappMessagesThisMonth: number
  emailOpenRate: number
  emailClickRate: number
  socialEngagement: number
  recentCampaigns: Array<{
    id: string
    name: string
    type: string
    status: string
    recipientCount: number
    opened: number
    clicked: number
    createdAt: string
  }>
  campaignsByType: Array<{
    type: string
    count: number
  }>
  monthlyEmailSent: Array<{
    month: string
    sent: number
    opened: number
    clicked: number
  }>
}

// PayAid brand colors for charts
const PAYAID_PURPLE = '#8B5CF6'
const PAYAID_DARK_PURPLE = '#6B4BA1'
const CHART_COLORS = [PAYAID_PURPLE, '#EC4899', '#10B981', '#F59E0B', '#3B82F6']

export default function MarketingDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [stats, setStats] = useState<MarketingDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [tenantId])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      // For now, use mock data until API is ready
      // TODO: Replace with actual API call: /api/marketing/dashboard/stats
      const mockStats: MarketingDashboardStats = {
        totalCampaigns: 24,
        activeCampaigns: 8,
        emailSent: 12500,
        emailSentThisMonth: 3200,
        emailSentLastMonth: 2800,
        emailGrowth: 14.3,
        socialPosts: 156,
        socialPostsThisMonth: 42,
        whatsappMessages: 890,
        whatsappMessagesThisMonth: 245,
        emailOpenRate: 28.5,
        emailClickRate: 4.2,
        socialEngagement: 12.8,
        recentCampaigns: [],
        campaignsByType: [
          { type: 'Email', count: 12 },
          { type: 'Social', count: 8 },
          { type: 'WhatsApp', count: 4 },
        ],
        monthlyEmailSent: [
          { month: 'Jan', sent: 2500, opened: 700, clicked: 105 },
          { month: 'Feb', sent: 2800, opened: 784, clicked: 118 },
          { month: 'Mar', sent: 3200, opened: 912, clicked: 134 },
        ],
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setStats(mockStats)
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error)
      setError(error.message || 'An unexpected error occurred while fetching data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading Marketing dashboard..." />
  }

  const emailGrowthColor = (stats?.emailGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
  const emailGrowthIcon = (stats?.emailGrowth || 0) >= 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Marketing</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/marketing/${tenantId}/Home/`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Home</Link>
              <Link href={`/marketing/${tenantId}/Campaigns`} className="text-gray-600 hover:text-gray-900 transition-colors">Campaigns</Link>
              <Link href={`/marketing/${tenantId}/Email`} className="text-gray-600 hover:text-gray-900 transition-colors">Email</Link>
              <Link href={`/marketing/${tenantId}/Social-Media`} className="text-gray-600 hover:text-gray-900 transition-colors">Social Media</Link>
              <Link href={`/marketing/${tenantId}/WhatsApp`} className="text-gray-600 hover:text-gray-900 transition-colors">WhatsApp</Link>
              <Link href={`/marketing/${tenantId}/Analytics`} className="text-gray-600 hover:text-gray-900 transition-colors">Analytics</Link>
              <Link href={`/marketing/${tenantId}/Segments`} className="text-gray-600 hover:text-gray-900 transition-colors">Segments</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardStats}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <ModuleSwitcher currentModule="marketing" />
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-6 shadow-lg mt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-purple-100">AI-Powered Marketing Platform - Automate, Optimize, and Scale</p>
          </div>
        </div>
      </div>

      {/* AI Capabilities Highlight */}
      <div className="p-6">
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI-Powered Marketing Features</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leverage advanced AI to automate and optimize your marketing</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Sales Automation</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automated prospecting, cold outreach, and follow-ups powered by AI</p>
                <Link href={`/crm/${tenantId}/SalesAutomation`}>
                  <Button variant="link" className="p-0 h-auto mt-2 text-purple-600">
                    Explore →
                  </Button>
                </Link>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Multi-Channel Sequences</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-optimized sequences across email, WhatsApp, and SMS</p>
                <Link href={`/marketing/${tenantId}/Sequences`}>
                  <Button variant="link" className="p-0 h-auto mt-2 text-purple-600">
                    Explore →
                  </Button>
                </Link>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Visitor Intelligence</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered intent scoring and anonymous visitor tracking</p>
                <Link href={`/crm/${tenantId}/Visitors`}>
                  <Button variant="link" className="p-0 h-auto mt-2 text-purple-600">
                    Explore →
                  </Button>
                </Link>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Conversation Intelligence</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI sentiment analysis and insights from all customer interactions</p>
                <Link href={`/crm/${tenantId}/CustomerSuccess`}>
                  <Button variant="link" className="p-0 h-auto mt-2 text-purple-600">
                    Explore →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
              <Megaphone className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCampaigns || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{stats?.activeCampaigns || 0} active</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Email Sent This Month</CardTitle>
              <Mail className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.emailSentThisMonth?.toLocaleString() || 0}</div>
              <p className={`text-xs flex items-center gap-1 mt-1 ${emailGrowthColor}`}>
                {emailGrowthIcon && <emailGrowthIcon className="w-3 h-3" />}
                {Math.abs(stats?.emailGrowth || 0).toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Social Posts</CardTitle>
              <Share2 className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.socialPostsThisMonth || 0}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">WhatsApp Messages</CardTitle>
              <MessageCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.whatsappMessagesThisMonth || 0}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.emailOpenRate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Email Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.emailClickRate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Social Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.socialEngagement?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Email Performance</CardTitle>
              <CardDescription>Email sent, opened, and clicked over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.monthlyEmailSent || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke={CHART_COLORS[0]} name="Sent" />
                  <Line type="monotone" dataKey="opened" stroke={CHART_COLORS[1]} name="Opened" />
                  <Line type="monotone" dataKey="clicked" stroke={CHART_COLORS[2]} name="Clicked" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaigns by Type</CardTitle>
              <CardDescription>Distribution of campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.campaignsByType || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(stats?.campaignsByType || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

