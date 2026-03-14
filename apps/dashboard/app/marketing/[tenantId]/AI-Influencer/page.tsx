'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function AIInfluencerPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch('/api/ai-influencer/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.campaigns) {
            setCampaigns(data.campaigns)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to fetch campaigns:', err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [token])

  if (loading) {
    return <PageLoading message="Loading campaigns..." fullScreen={false} />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Influencer Marketing</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create realistic AI influencer videos in minutes. No designer, no influencer, no video editor needed.
          </p>
        </div>
        <Link href={`/marketing/${tenantId}/AI-Influencer/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No campaigns yet. Create your first AI influencer video!</p>
            <Link href={`/marketing/${tenantId}/AI-Influencer/New`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Your First Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">{campaign.name || 'Untitled Campaign'}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {campaign.industry || 'General'} • Created {new Date(campaign.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{campaign._count?.characters || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Scripts:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{campaign._count?.scripts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Videos:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{campaign._count?.videos || 0}</span>
                  </div>
                </div>
                <Link href={`/marketing/${tenantId}/AI-Influencer/Campaigns/${campaign.id}`}>
                  <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    View Campaign
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 dark:text-blue-300 font-bold">1</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pick Character</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Generate AI character</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 dark:text-blue-300 font-bold">2</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload Product</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Add your product image</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 dark:text-blue-300 font-bold">3</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Generate Script</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">AI creates 3 variations</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 dark:text-blue-300 font-bold">4</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pick Style</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Testimonial/Demo</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 dark:text-blue-300 font-bold">5</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Generate Video</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Download & export</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
