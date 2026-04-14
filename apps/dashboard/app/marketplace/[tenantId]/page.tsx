'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { Store, CheckCircle, Search, Filter, Package, Star, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'

const CATEGORIES = ['All', 'Integration', 'Accounting', 'Payments', 'Communication', 'Productivity', 'Logistics', 'Collaboration']

type App = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  rating?: number
  reviews?: number
  installed: boolean
  status: string
  plan: string
  permissions: string[]
}

export default function MarketplacePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [installingId, setInstallingId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['marketplace-apps', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/marketplace/apps')
      if (!res.ok) throw new Error('Failed to load marketplace')
      return res.json()
    },
    enabled: !!tenantId,
  })

  const install = useMutation({
    mutationFn: async (appId: string) => {
      const res = await apiRequest('/api/v1/marketplace/apps', {
        method: 'POST',
        body: JSON.stringify({ app_id: appId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Installation failed')
      }
      return res.json()
    },
    onMutate: (appId) => setInstallingId(appId),
    onSettled: () => setInstallingId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketplace-apps', tenantId] }),
  })

  const apps: App[] = (data?.apps ?? []).filter((a: App) => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || a.category === category
    return matchesSearch && matchesCategory
  })

  const installedCount: number = data?.installed_count ?? 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Store className="w-7 h-7 text-indigo-600" />
            Marketplace
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Extend PayAid with integrations, connectors, and AI capabilities.
            {installedCount > 0 && (
              <span className="ml-2 text-emerald-600 font-medium">
                {installedCount} installed
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search + category filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search apps…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? 'default' : 'outline'}
              onClick={() => setCategory(cat)}
              className={category === cat ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <PageLoading message="Loading marketplace…" fullScreen={false} />
      ) : error ? (
        <div className="text-center py-12 text-red-500">Failed to load marketplace apps.</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No apps match your search</p>
          <p className="text-sm text-gray-400 mt-1">Try a different category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="hover:shadow-md hover:-translate-y-[1px] transition-all flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shrink-0">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{app.name}</p>
                      {app.installed && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Installed
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">{app.category}</Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 mb-3">{app.description}</p>

                {app.rating !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{app.rating.toFixed(1)}</span>
                    <span>({app.reviews} reviews)</span>
                    <span className="ml-auto capitalize">
                      <Badge variant="secondary" className="text-xs">{app.plan}</Badge>
                    </span>
                  </div>
                )}

                <Button
                  size="sm"
                  className={
                    app.installed
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }
                  disabled={app.installed || installingId === app.id}
                  onClick={() => install.mutate(app.id)}
                >
                  {installingId === app.id
                    ? 'Installing…'
                    : app.installed
                    ? 'Installed'
                    : 'Install'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
