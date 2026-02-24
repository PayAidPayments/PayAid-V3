'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function PDFMyPDFsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>My PDFs</CardTitle>
          <CardDescription>PDFs you create or upload appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No PDFs stored yet. Use the tools to create or convert files.</p>
            <Link href={`/pdf/${tenantId}/Tools`} className="mt-4 inline-block text-purple-600 hover:underline">
              Open PDF Tools →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
