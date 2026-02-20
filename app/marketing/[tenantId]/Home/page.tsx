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
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Brain,
  Zap,
  Target
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
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

// PayAid Brand Colors for charts
const PURPLE_PRIMARY = '#53328A' // PayAid Purple
const GOLD_ACCENT = '#F5C700' // PayAid Gold
const SUCCESS = '#059669' // Success (Emerald)
const INFO = '#0284C7' // Info (Blue)
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#EC4899', '#F59E0B']

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
    return <PageLoading message="Loading Marketing dashboard..." fullScreen={true} />
  }

  // Get module configuration
  const moduleConfig = getModuleConfig('marketing')

  // Hero metrics
  const heroMetrics = [
    {
      label: 'Total Campaigns',
      value: stats?.totalCampaigns || 0,
      change: stats?.activeCampaigns ? Math.round((stats.activeCampaigns / stats.totalCampaigns) * 100) : 0,
      trend: 'up' as const,
      icon: <Megaphone className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Email Sent',
      value: stats?.emailSentThisMonth?.toLocaleString() || '0',
      change: stats?.emailGrowth,
      trend: (stats?.emailGrowth || 0) >= 0 ? 'up' as const : 'down' as const,
      icon: <Mail className="w-5 h-5" />,
      color: 'info' as const,
    },
    {
      label: 'Social Posts',
      value: stats?.socialPostsThisMonth || 0,
      icon: <Share2 className="w-5 h-5" />,
      color: 'success' as const,
    },
    {
      label: 'WhatsApp Messages',
      value: stats?.whatsappMessagesThisMonth || 0,
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'success' as const,
    },
  ]

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Marketing"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
        subtitle="AI-Powered Marketing Platform - Automate, Optimize, and Scale"
      />

      {/* Content Sections - 32px gap between sections */}
      <div className="p-6 space-y-8">
        {/* AI Capabilities Highlight */}
        <GlassCard>
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
        </GlassCard>

        {/* Performance Metrics */}
        <GlassCard delay={0.1}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Email Open Rate</p>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.emailOpenRate?.toFixed(1) || 0}%</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Email Click Rate</p>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.emailClickRate?.toFixed(1) || 0}%</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Social Engagement</p>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.socialEngagement?.toFixed(1) || 0}%</div>
            </div>
          </div>
        </GlassCard>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard delay={0.2}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Monthly Email Performance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Email sent, opened, and clicked over time</p>
            <div style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.monthlyEmailSent || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: `1px solid ${PURPLE_PRIMARY}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke={CHART_COLORS[0]} name="Sent" strokeWidth={2} />
                  <Line type="monotone" dataKey="opened" stroke={CHART_COLORS[1]} name="Opened" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicked" stroke={CHART_COLORS[2]} name="Clicked" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard delay={0.3}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Campaigns by Type</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Distribution of campaigns</p>
            <div style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.campaignsByType || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill={PURPLE_PRIMARY}
                    dataKey="count"
                  >
                    {(stats?.campaignsByType || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: `1px solid ${PURPLE_PRIMARY}`,
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

