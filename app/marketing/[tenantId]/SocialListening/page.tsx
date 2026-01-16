'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Ear, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle,
  Heart,
  Share2,
  Reply,
  Search,
  Filter,
  Settings,
  Play,
  Pause
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface SocialMention {
  id: string
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube'
  type: 'mention' | 'comment' | 'review' | 'message'
  author: string
  authorHandle?: string
  content: string
  sentiment: 'positive' | 'neutral' | 'negative'
  intent: 'high' | 'medium' | 'low'
  engagement: {
    likes: number
    shares: number
    comments: number
  }
  url: string
  timestamp: string
  requiresResponse: boolean
  tags: string[]
}

interface ListeningRule {
  id: string
  name: string
  keywords: string[]
  platforms: string[]
  status: 'active' | 'paused'
  alertOnMatch: boolean
  autoRespond: boolean
}

export default function SocialListeningPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [mentions, setMentions] = useState<SocialMention[]>([])
  const [rules, setRules] = useState<ListeningRule[]>([])
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'requires-response'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [tenantId, token])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!token) return

      const [mentionsRes, rulesRes] = await Promise.all([
        fetch('/api/marketing/social-listening/mentions', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/marketing/social-listening/rules', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      if (mentionsRes.ok) {
        const data = await mentionsRes.json()
        setMentions(data.mentions || [])
      }

      if (rulesRes.ok) {
        const data = await rulesRes.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'twitter':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
      case 'linkedin':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'instagram':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      case 'youtube':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return <PageLoading message="Loading social listening data..." fullScreen={false} />
  }

  const filteredMentions = mentions.filter(mention => {
    const matchesSearch = searchQuery === '' || 
      mention.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mention.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' ||
      (filter === 'positive' && mention.sentiment === 'positive') ||
      (filter === 'negative' && mention.sentiment === 'negative') ||
      (filter === 'requires-response' && mention.requiresResponse)
    
    return matchesSearch && matchesFilter
  })

  const totalMentions = mentions.length
  const positiveMentions = mentions.filter(m => m.sentiment === 'positive').length
  const negativeMentions = mentions.filter(m => m.sentiment === 'negative').length
  const requiresResponse = mentions.filter(m => m.requiresResponse).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Social Listening</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor, listen, and engage with mentions across social media platforms
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Settings className="h-4 w-4 mr-2" />
          Listening Rules
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalMentions}
                </p>
              </div>
              <Ear className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Positive</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {positiveMentions}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Negative</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {negativeMentions}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Needs Response</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {requiresResponse}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentions..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('positive')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'positive'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Positive
              </button>
              <button
                onClick={() => setFilter('negative')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'negative'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Negative
              </button>
              <button
                onClick={() => setFilter('requires-response')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'requires-response'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Needs Response
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentions */}
      <Card>
        <CardHeader>
          <CardTitle>Social Mentions</CardTitle>
          <CardDescription>Monitor what people are saying about your brand</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMentions.length > 0 ? (
            <div className="space-y-4">
              {filteredMentions.map((mention) => (
                <div
                  key={mention.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getPlatformColor(mention.platform)}>
                          {mention.platform}
                        </Badge>
                        <Badge className={getSentimentColor(mention.sentiment)}>
                          {mention.sentiment}
                        </Badge>
                        {mention.requiresResponse && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Response
                          </Badge>
                        )}
                        {mention.intent === 'high' && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            High Intent
                          </Badge>
                        )}
                      </div>
                      <div className="mb-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {mention.author}
                          {mention.authorHandle && (
                            <span className="text-sm text-gray-500 ml-1">
                              @{mention.authorHandle}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(mention.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{mention.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {mention.engagement.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-4 w-4" />
                          {mention.engagement.shares}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {mention.engagement.comments}
                        </span>
                      </div>
                      {mention.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {mention.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Ear className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No mentions found. Set up listening rules to start monitoring social media.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Listening Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Listening Rules</CardTitle>
          <CardDescription>Configure what to monitor and how to respond</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length > 0 ? (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{rule.name}</h3>
                        <Badge
                          className={
                            rule.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }
                        >
                          {rule.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p><strong>Keywords:</strong> {rule.keywords.join(', ')}</p>
                        <p><strong>Platforms:</strong> {rule.platforms.join(', ')}</p>
                        <p><strong>Alert on Match:</strong> {rule.alertOnMatch ? 'Yes' : 'No'}</p>
                        <p><strong>Auto Respond:</strong> {rule.autoRespond ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {rule.status === 'active' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No listening rules configured. Create rules to monitor keywords, mentions, and brand mentions.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Create Listening Rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
