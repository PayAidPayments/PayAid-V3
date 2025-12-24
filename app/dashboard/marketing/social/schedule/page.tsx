'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ScheduledPost {
  id: string
  content: string
  imageUrl?: string
  videoUrl?: string
  platform: string
  scheduledAt: string
  status: string
  account: {
    id: string
    platform: string
    accountName: string
  }
}

export default function SchedulePage() {
  const { data, isLoading, refetch } = useQuery<{ scheduledPosts: ScheduledPost[] }>({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const response = await apiRequest('/api/social-media/scheduled')
      if (!response.ok) throw new Error('Failed to fetch scheduled posts')
      return response.json()
    },
  })

  const scheduledPosts = data?.scheduledPosts || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Posts</h1>
          <p className="mt-2 text-gray-600">
            Schedule and manage your social media posts
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/marketing/social/create-post">
            <Button>Create New Post</Button>
          </Link>
          <Link href="/dashboard/marketing/social">
            <Button variant="outline">Back to Social Media</Button>
          </Link>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Content Calendar</CardTitle>
          <CardDescription>
            View and manage your scheduled posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-lg font-medium">Content Calendar</p>
            <p className="text-sm mt-2">
              Calendar view will show all scheduled posts across platforms
            </p>
            <p className="text-xs mt-1 text-gray-400">
              Connect at least one platform to start scheduling posts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
          <CardDescription>
            Your upcoming scheduled posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading scheduled posts...</div>
          ) : scheduledPosts.length > 0 ? (
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 border border-gray-200 rounded-lg flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                      <span className="text-xs text-gray-500">
                        {post.account.accountName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        post.status === 'SCHEDULED' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {post.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-gray-700">{post.content}</p>
                    {post.imageUrl && (
                      <div className="mt-2">
                        <img src={post.imageUrl} alt="Post image" className="max-w-xs rounded" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>No scheduled posts yet</p>
              <p className="text-sm mt-2">
                Create a post and schedule it for later
              </p>
              <Link href="/dashboard/marketing/social/create-post">
                <Button className="mt-4">Create Your First Post</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/marketing/social/create-post">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Create Post</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Use AI to generate a new social media post
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/marketing/social/create-image">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Generate Image</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create custom images for your posts
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bulk Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Schedule multiple posts at once (Coming soon)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
