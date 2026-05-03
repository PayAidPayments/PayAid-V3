'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Zap, CheckCircle, Settings, BookOpen, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

interface Integration {
  id: string
  name: string
  description: string
  category: 'payment' | 'communication' | 'productivity' | 'analytics' | 'other'
  icon: string
  isConnected: boolean
  isPreBuilt: boolean
  apiDocs?: string
  setupRequired?: boolean
}

const integrations: Integration[] = [
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
    apiDocs: 'https://docs.sendgrid.com',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and voice communication platform',
    category: 'communication',
    icon: '📱',
    isConnected: false,
    isPreBuilt: true,
    apiDocs: 'https://www.twilio.com/docs',
  },
  {
    id: 'exotel',
    name: 'Exotel',
    description: 'Cloud telephony platform for calls and SMS',
    category: 'communication',
    icon: '☎️',
    isConnected: false,
    isPreBuilt: true,
    apiDocs: 'https://developer.exotel.com',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail account for email sync',
    category: 'communication',
    icon: '📬',
    isConnected: false,
    isPreBuilt: true,
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Connect your Outlook account for email sync',
    category: 'communication',
    icon: '📮',
    isConnected: false,
    isPreBuilt: true,
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your Google Calendar events',
    category: 'productivity',
    icon: '📅',
    isConnected: false,
    isPreBuilt: true,
  },
  {
    id: 'wati',
    name: 'WATI',
    description: 'WhatsApp Business API for messaging',
    category: 'communication',
    icon: '💬',
    isConnected: false,
    isPreBuilt: true,
    apiDocs: 'https://docs.wati.io',
  },
]

const categories = ['all', 'payment', 'communication', 'productivity', 'analytics', 'other']

export default function IntegrationMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { token } = useAuthStore()

  const connectIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to connect integration')
      return response.json()
    },
  })

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-green-100 text-green-800',
      communication: 'bg-blue-100 text-blue-800',
      productivity: 'bg-purple-100 text-purple-800',
      analytics: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  return (
    <div className="w-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Marketplace</h1>
          <p className="mt-2 text-gray-600">
            Discover and connect integrations to extend your CRM capabilities
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{integration.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge className={getCategoryColor(integration.category)}>
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {integration.isConnected && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <CardDescription className="mt-2">{integration.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {integration.isPreBuilt && (
                    <Badge variant="outline" className="text-xs">
                      Pre-built
                    </Badge>
                  )}
                  {integration.setupRequired && (
                    <Badge variant="outline" className="text-xs">
                      Setup Required
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {integration.isConnected ? (
                    <>
                      <Button variant="outline" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      {integration.apiDocs && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={integration.apiDocs} target="_blank" rel="noopener noreferrer">
                            <BookOpen className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        className="flex-1"
                        onClick={() => connectIntegration.mutate(integration.id)}
                        disabled={connectIntegration.isPending}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                      {integration.apiDocs && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={integration.apiDocs} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No integrations found matching your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
