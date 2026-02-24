'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Share2 } from 'lucide-react'

export default function DriveSharedPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Shared with you</CardTitle>
          <CardDescription>Files and folders shared with you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Share2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No shared files. Shared items will appear here.</p>
            <Link href={`/drive/${tenantId}/MyDrive`} className="mt-4 inline-block text-purple-600 hover:underline">Back to My Drive</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
