'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SOCIAL_PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Connect your Facebook page to post updates and engage with your audience',
    connected: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Link your Instagram business account for visual content marketing',
    connected: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Connect LinkedIn company page for professional networking and B2B marketing',
    connected: false,
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '🐦',
    description: 'Link your Twitter/X account for real-time updates and engagement',
    connected: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    description: 'Connect YouTube channel for video content marketing',
    connected: false,
  },
]

export default function SocialMediaPage() {
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery<{ accounts: any[] }>({
    queryKey: ['social-media-accounts'],
    queryFn: async () => {
      const response = await apiRequest('/api/social-media/accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      return response.json()
    },
  })

  const connectedAccounts = accountsData?.accounts || []
  const connectedPlatforms = connectedAccounts.map(acc => acc.platform)

  const handleConnect = (platformId: string) => {
    // TODO: Implement OAuth flow for platform
    // For now, show a message
    alert(`To connect ${platformId}, we'll use OAuth authentication. This is more secure than username/password.\n\nIn production, this will redirect to the platform's OAuth authorization page.`)
    // In production, redirect to OAuth authorization URL
    // Example: window.location.href = `/api/auth/oauth/${platformId}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Media Marketing</h1>
        <p className="mt-2 text-gray-600">
          Connect your social media accounts and use AI to create and schedule content
        </p>
      </div>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>
            Connect your social media accounts using OAuth (secure, no passwords required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => {
              const isConnected = connectedPlatforms.includes(platform.id)
              return (
                <div
                  key={platform.id}
                  className="p-4 border border-gray-200 rounded-lg flex items-start justify-between"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl">{platform.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                      {isConnected && (
                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ Connected
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={isConnected ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Content Creation */}
      <Card>
        <CardHeader>
          <CardTitle>AI Content Creation</CardTitle>
          <CardDescription>
            Use AI to generate posts, images, and content for your social media
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/marketing/social/create-post">
              <Card className="transition-all hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✍️</span>
                    <div>
                      <CardTitle>Create Post</CardTitle>
                      <CardDescription>AI-powered post generation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Generate engaging social media posts using AI. Customize tone, length, and style.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/marketing/social/create-image">
              <Card className="transition-all hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎨</span>
                    <div>
                      <CardTitle>Generate Image</CardTitle>
                      <CardDescription>AI image generation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Create custom images for your posts using AI image generation.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/marketing/social/schedule">
              <Card className="transition-all hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📅</span>
                    <div>
                      <CardTitle>Schedule Posts</CardTitle>
                      <CardDescription>Content calendar</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Schedule posts across all connected platforms. View your content calendar.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Analytics</CardTitle>
          <CardDescription>
            Track performance across all your social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Connect at least one platform to view analytics</p>
            <p className="text-sm mt-2">
              Analytics will show engagement, reach, impressions, and more for each platform
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Information */}
      <Card>
        <CardHeader>
          <CardTitle>Why OAuth Instead of Username/Password?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ <strong>More Secure:</strong> We never store your passwords</p>
            <p>✅ <strong>Platform Recommended:</strong> All major platforms recommend OAuth</p>
            <p>✅ <strong>Better Compliance:</strong> Meets security and privacy standards</p>
            <p>✅ <strong>Token Refresh:</strong> Automatic token renewal without re-authentication</p>
            <p>✅ <strong>Granular Permissions:</strong> You control what we can access</p>
            <p>✅ <strong>Easy Disconnect:</strong> Revoke access anytime from platform settings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
