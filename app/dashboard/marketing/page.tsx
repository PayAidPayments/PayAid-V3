'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
        <p className="mt-2 text-gray-600">Manage your marketing campaigns and segments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Email, WhatsApp, and SMS campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create and manage marketing campaigns across multiple channels. Track performance
              metrics and engagement rates.
            </p>
            <Link href="/dashboard/marketing/campaigns">
              <Button>Manage Campaigns</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segments</CardTitle>
            <CardDescription>Customer segmentation for targeted campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create customer segments based on behavior, purchase history, and demographics for
              targeted marketing.
            </p>
            <Link href="/dashboard/marketing/segments">
              <Button variant="outline">Manage Segments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
