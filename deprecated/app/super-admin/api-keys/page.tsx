'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, Search, ExternalLink } from 'lucide-react'

interface ApiKeyRow {
  id: string
  orgId: string
  tenantName: string
  name: string
  scopes: string[]
  rateLimit: number
  expiresAt: string
  usageCount: number
}

export default function SuperAdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/super-admin/api-keys?${params}`)
      if (res.ok) {
        const json = await res.json()
        setKeys(json.data || [])
      } else setKeys([])
    } catch {
      setKeys([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = keys.filter(
    (k) =>
      !search ||
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.tenantName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Key Oversight</h1>
        <p className="text-muted-foreground">
          View and monitor API keys across all merchants
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by key name or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchKeys()}
            className="pl-9"
          />
        </div>
        <Button onClick={fetchKeys}>Search</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            All Merchant API Keys
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Active keys only. Revoke or rotate from tenant admin or support.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-2">No API keys found.</p>
              <p className="text-sm">Tenants create API keys in their Admin → Developer portal.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{k.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {k.tenantName} · Scopes: {k.scopes.join(', ') || '—'} · Limit: {k.rateLimit}/hr
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(k.expiresAt).toLocaleDateString()} · Usage: {k.usageCount}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/super-admin/tenants/${k.orgId}`}>
                      <ExternalLink className="h-4 w-4 mr-1" /> Tenant
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
