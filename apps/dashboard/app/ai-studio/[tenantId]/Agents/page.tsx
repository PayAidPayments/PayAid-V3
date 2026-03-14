'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  Megaphone, 
  Users, 
  Globe, 
  UtensilsCrossed, 
  ShoppingCart, 
  Factory,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Brain,
  Target,
  BarChart3
} from 'lucide-react'
// Note: getAllAgents is available but we'll use predefined agent data for better UI

// PayAid brand colors
const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

interface Agent {
  id: string
  name: string
  description: string
  category: string
  icon: any
  color: string
  features: string[]
  useCases: string[]
  status: 'active' | 'coming-soon'
}

export default function AIAgentsMarketplacePage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  // Categorize agents
  const agentCategories = {
    'Business Core': [
      {
        id: 'cofounder',
        name: 'Co-Founder',
        description: 'Strategic business partner - orchestrates all specialists',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-500',
        features: ['Strategic planning', 'Multi-agent coordination', 'Business health analysis'],
        useCases: ['What should I focus on this week?', 'Analyze overall business performance', 'Strategic decision making'],
        status: 'active' as const
      },
      {
        id: 'finance',
        name: 'CFO Agent',
        description: 'Financial expert - invoices, payments, accounting, GST',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-500',
        features: ['Invoice management', 'GST compliance', 'Cash flow analysis', 'Expense tracking'],
        useCases: ['Show me unpaid invoices', 'Calculate GST liability', 'Analyze cash flow'],
        status: 'active' as const
      },
      {
        id: 'sales',
        name: 'Sales Agent',
        description: 'Sales expert - leads, deals, pipeline, conversions',
        icon: TrendingUp,
        color: 'from-blue-500 to-cyan-500',
        features: ['Lead scoring', 'Pipeline analysis', 'Conversion optimization', 'Follow-up automation'],
        useCases: ['What leads need follow-up?', 'Analyze sales pipeline', 'Identify high-value deals'],
        status: 'active' as const
      },
      {
        id: 'marketing',
        name: 'Marketing Agent',
        description: 'Marketing expert - campaigns, sequences, social media, WhatsApp',
        icon: Megaphone,
        color: 'from-orange-500 to-red-500',
        features: ['Campaign analysis', 'Content creation', 'Social media strategy', 'ROI optimization'],
        useCases: ['Create a LinkedIn post', 'Analyze campaign performance', 'Suggest marketing strategies'],
        status: 'active' as const
      },
      {
        id: 'hr',
        name: 'HR Agent',
        description: 'HR expert - employees, payroll, attendance, leave',
        icon: Users,
        color: 'from-indigo-500 to-purple-500',
        features: ['Payroll management', 'Attendance tracking', 'Leave management', 'Hiring assistance'],
        useCases: ['Calculate payroll', 'Review attendance', 'Manage leave requests'],
        status: 'active' as const
      },
    ],
    'Industry Specialists': [
      {
        id: 'restaurant',
        name: 'Restaurant Agent',
        description: 'Restaurant operations expert - menu, orders, kitchen operations',
        icon: UtensilsCrossed,
        color: 'from-red-500 to-pink-500',
        features: ['Menu optimization', 'Order management', 'Kitchen operations', 'Customer feedback'],
        useCases: ['Optimize menu pricing', 'Analyze order patterns', 'Kitchen efficiency'],
        status: 'active' as const
      },
      {
        id: 'retail',
        name: 'Retail Agent',
        description: 'Retail operations expert - products, inventory, POS, sales',
        icon: ShoppingCart,
        color: 'from-blue-500 to-indigo-500',
        features: ['Inventory management', 'POS optimization', 'Sales analysis', 'Product recommendations'],
        useCases: ['Optimize inventory levels', 'Analyze sales trends', 'Product performance'],
        status: 'active' as const
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing Agent',
        description: 'Manufacturing expert - production, materials, quality, supply chain',
        icon: Factory,
        color: 'from-gray-600 to-gray-800',
        features: ['Production planning', 'Quality control', 'Supply chain optimization', 'Material management'],
        useCases: ['Optimize production schedule', 'Quality analysis', 'Supply chain efficiency'],
        status: 'active' as const
      },
    ],
    'Coming Soon': [
      {
        id: 'customer-success',
        name: 'Customer Success Agent',
        description: 'Monitor customers, spot risks, drive renewals',
        icon: Target,
        color: 'from-teal-500 to-cyan-500',
        features: ['Churn prediction', 'Renewal tracking', 'Health scores', 'Risk monitoring'],
        useCases: ['Identify at-risk customers', 'Track renewals', 'Customer health analysis'],
        status: 'coming-soon' as const
      },
      {
        id: 'analytics',
        name: 'Analytics Agent',
        description: 'Advanced analytics and business intelligence',
        icon: BarChart3,
        color: 'from-violet-500 to-purple-500',
        features: ['Revenue analytics', 'Funnel analysis', 'Predictive insights', 'Custom reports'],
        useCases: ['Revenue forecasting', 'Funnel optimization', 'Business insights'],
        status: 'coming-soon' as const
      },
      {
        id: 'growth-strategist',
        name: 'Growth Strategist',
        description: 'Growth hacking and scaling strategies',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        features: ['Growth strategies', 'Scaling plans', 'Market expansion', 'Product-market fit'],
        useCases: ['Growth strategies', 'Scaling plans', 'Market expansion'],
        status: 'coming-soon' as const
      },
    ]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Agent Marketplace</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose from specialized AI agents to automate and enhance your business operations
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">8</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coming Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3+</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Capabilities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">50+</p>
              </div>
              <Brain className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Categories */}
      {Object.entries(agentCategories).map(([category, agents]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{category}</h2>
            <Badge variant="outline" className="text-sm">
              {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon
              return (
                <Card 
                  key={agent.id} 
                  className={`hover:shadow-xl transition-all ${
                    agent.status === 'coming-soon' ? 'opacity-75' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${agent.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          {agent.status === 'active' && (
                            <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {agent.status === 'coming-soon' && (
                            <Badge className="mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <Star className="h-3 w-3 mr-1" />
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm">{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Features:</p>
                      <ul className="space-y-1">
                        {agent.features.map((feature, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Use Cases:</p>
                      <ul className="space-y-1">
                        {agent.useCases.slice(0, 2).map((useCase, idx) => (
                          <li key={idx} className="text-xs text-gray-500 dark:text-gray-500 italic">
                            &quot;{useCase}&quot;
                          </li>
                        ))}
                      </ul>
                    </div>
                    {agent.status === 'active' ? (
                      <Link href={`/ai-studio/${tenantId}/Cofounder?agent=${agent.id}`}>
                        <Button className="w-full" style={{ backgroundColor: PAYAID_PURPLE }}>
                          Use Agent
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Coming Soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Quick Access to Co-Founder */}
      <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: PAYAID_PURPLE }} />
            Start Using AI Agents
          </CardTitle>
          <CardDescription>
            Access the AI Co-Founder interface to interact with any of these agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/ai-studio/${tenantId}/Cofounder`}>
            <Button className="w-full" size="lg" style={{ backgroundColor: PAYAID_PURPLE }}>
              Open AI Co-Founder
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
