'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { File, Folder, Upload } from 'lucide-react'

export default function DriveMyDrivePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [files, setFiles] = useState<any[]>([])
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      fetch('/api/drive', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { files: [] }))
        .then((d) => setFiles(d.files || []))
        .catch(() => setFiles([]))
    }
  }, [token])

  const folders = files.filter((f) => f.fileType === 'folder')
  const fileList = files.filter((f) => f.fileType !== 'folder')

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Drive</CardTitle>
          <CardDescription>Your files and folders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/dashboard/drive" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Upload className="h-5 w-5" /> Open Drive (upload and manage)
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((f) => (
              <div key={f.id} className="p-4 border rounded-lg flex items-center gap-3 hover:border-purple-500">
                <Folder className="h-8 w-8 text-amber-500 shrink-0" />
                <span className="font-medium truncate">{f.name}</span>
              </div>
            ))}
            {fileList.map((f) => (
              <div key={f.id} className="p-4 border rounded-lg flex items-center gap-3 hover:border-purple-500">
                <File className="h-8 w-8 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.fileSize ? `${(f.fileSize / 1024).toFixed(1)} KB` : ''}</div>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No files yet. Upload from Drive.</p>
                <Link href="/dashboard/drive" className="mt-2 inline-block text-purple-600 hover:underline">Go to Drive</Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
