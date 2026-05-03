'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Search, Zap, Webhook, Code, BookOpen, Settings, CheckCircle } from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  category: 'payment' | 'communication' | 'productivity' | 'analytics' | 'other'
  icon: string
  isConnected: boolean
  isPreBuilt: boolean
  apiDocs?: string
}

const preBuiltIntegrations: Integration[] = [
  {
    id: 'payaid-payments',
    name: 'PayAid Payments',
    description: 'Integrated payment gateway for all payment processing',
    category: 'payment',
    icon: '💳',
    isConnected: true,
    isPreBuilt: true,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery service for transactional and marketing emails',
    category: 'communication',
    icon: '📧',
    isConnected: false,
    isPreBuilt: true,
  },
  {
    id: 'wati',
    name: 'WATI',
    description: 'WhatsApp Business API for messaging and customer support',
    category: 'communication',
    icon: '💬',
    isConnected: false,
    isPreBuilt: true,
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and voice communication platform',
    category: 'communication',
    icon: '📞',
    isConnected: false,
    isPreBuilt: true,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect PayAid with 5000+ apps via Zapier',
    category: 'productivity',
    icon: '⚡',
    isConnected: false,
    isPreBuilt: false,
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Automate workflows with visual builder',
    category: 'productivity',
    icon: '🔧',
    isConnected: false,
    isPreBuilt: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get PayAid notifications in Slack',
    category: 'communication',
    icon: '💬',
    isConnected: false,
    isPreBuilt: false,
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Sync data with Google Sheets',
    category: 'productivity',
    icon: '📊',
    isConnected: false,
    isPreBuilt: false,
  },
]

export default function IntegrationsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All', icon: '📦' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'communication', label: 'Communication', icon: '📧' },
    { id: 'productivity', label: 'Productivity', icon: '⚡' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ]

  const filteredIntegrations = preBuiltIntegrations.filter((integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(search.toLowerCase()) ||
      integration.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API & Integration Hub</h1>
        <p className="mt-2 text-gray-600">
          Connect third-party services, manage API keys, and build custom integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Marketplace
        </button>
        <a
          href="/dashboard/api-docs"
          className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          API Documentation
        </a>
        <a
          href="/dashboard/settings?tab=api-keys"
          className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          API Keys
        </a>
        <a
          href="/dashboard/settings?tab=webhooks"
          className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          Webhooks
        </a>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    {integration.isPreBuilt && (
                      <Badge variant="outline" className="mt-1">
                        Pre-built
                      </Badge>
                    )}
                  </div>
                </div>
                {integration.isConnected && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {integration.isConnected ? (
                  <Button variant="outline" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                ) : (
                  <Button className="flex-1">
                    <Zap className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
                {integration.apiDocs && (
                  <Button variant="outline">
                    <BookOpen className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Integration Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Build Custom Integration
          </CardTitle>
          <CardDescription>
            Create your own integration using our REST API and webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              View API Docs
            </Button>
            <Button variant="outline">
              <Webhook className="w-4 h-4 mr-2" />
              Setup Webhooks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

