'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Plus } from 'lucide-react'

export default function MarketingSocialMediaPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Social Media</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage social media posts and accounts</p>
        </div>
        <Link href={`/marketing/${tenantId}/Social-Media/Create-Post`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={`/marketing/${tenantId}/Social-Media`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Share2 className="w-5 h-5" />
                Social Posts
              </CardTitle>
              <CardDescription className="dark:text-gray-400">View and manage all social media posts</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/marketing/${tenantId}/Social-Media/Schedule`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Scheduled Posts</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage scheduled social media posts</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/marketing/${tenantId}/Social-Media/Create-Image`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Generate Image</CardTitle>
              <CardDescription className="dark:text-gray-400">Create custom images for your posts</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/marketing/${tenantId}/Social-Media/Create-Post`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Create Post</CardTitle>
              <CardDescription className="dark:text-gray-400">Use AI to generate a new social media post</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
