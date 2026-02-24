'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder } from 'lucide-react'

export default function DocsFoldersPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Folders</CardTitle>
          <CardDescription>Organise documents into folders (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Folder organisation will be available in a future update.</p>
            <Link href={`/docs/${tenantId}/Documents`} className="mt-4 inline-block text-purple-600 hover:underline">
              View all documents →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
