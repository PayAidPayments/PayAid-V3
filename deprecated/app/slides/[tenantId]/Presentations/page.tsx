'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Presentation, Plus, Search } from 'lucide-react'

export default function SlidesPresentationsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [presentations, setPresentations] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      fetch('/api/slides', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { presentations: [] }))
        .then((d) => setPresentations(d.presentations || []))
        .catch(() => setPresentations([]))
    }
  }, [token])

  const filtered = presentations.filter(
    (p) => !search || (p.name && p.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Presentations</CardTitle>
          <CardDescription>Create and edit presentations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                placeholder="Search presentations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <Link
              href={tenantId ? `/slides/${tenantId}/Presentations` : '/slides'}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" /> New Presentation
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={tenantId ? `/slides/${tenantId}/Presentations/${p.id}` : '#'}
                className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3"
              >
                <Presentation className="h-8 w-8 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-sm text-gray-500">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''}
                  </div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Presentation className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                {search ? 'No presentations match your search.' : 'No presentations yet. Create one from Dashboard.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
