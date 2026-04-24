'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Clock3, History, Settings2 } from 'lucide-react'

export default function MarketingSocialMediaPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Channels</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Choose where to publish, then use Compose for creation and History for tracking.
          </p>
        </div>
        <Link href={`/marketing/${tenantId}/Studio`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Open Compose
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={`/marketing/${tenantId}/Studio`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Sparkles className="w-5 h-5" />
                Compose
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Draft channel copy, generate media, review compliance, and launch.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/marketing/${tenantId}/History`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <History className="w-5 h-5" />
                History
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Track sent/failed runs, delivery outcomes, and performance.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/marketing/${tenantId}/Social-Media/Schedule`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Clock3 className="w-5 h-5" />
                Schedule
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Review upcoming posts and schedule windows by channel.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/settings/${tenantId}/Integrations/Social`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Settings2 className="w-5 h-5" />
                Channel settings
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Connect accounts and verify connector health before publishing.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
