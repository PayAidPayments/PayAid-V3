'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'

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
  const params = useParams()
  const tenantId = params.tenantId as string
  const searchParams = useSearchParams()
  const prefillContent = searchParams.get('content')
  const prefillImageUrl = searchParams.get('imageUrl')
  
  const { data, isLoading, refetch } = useQuery<{ scheduledPosts: ScheduledPost[] }>({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const response = await apiRequest('/api/social-media/scheduled')
      if (!response.ok) throw new Error('Failed to fetch scheduled posts')
      return response.json()
    },
  })

  const scheduledPosts = data?.scheduledPosts || []

  if (isLoading) {
    return <PageLoading message="Loading scheduled posts..." fullScreen={false} />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Schedule Posts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Schedule and manage your social media posts
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/marketing/${tenantId}/Social-Media/Create-Post${prefillContent ? `?content=${encodeURIComponent(prefillContent)}&imageUrl=${prefillImageUrl ? encodeURIComponent(prefillImageUrl) : ''}` : ''}`}>
            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create New Post</Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Social-Media`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back to Social Media</Button>
          </Link>
        </div>
      </div>

      {scheduledPosts.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No scheduled posts yet</p>
            <Link href={`/marketing/${tenantId}/Social-Media/Create-Post`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Schedule Your First Post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scheduledPosts.map((post) => (
            <Card key={post.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {post.platform}
                  </CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {post.content}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div>Scheduled: {format(new Date(post.scheduledAt), 'PPp')}</div>
                    {post.account && (
                      <div>Account: {post.account.accountName}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
