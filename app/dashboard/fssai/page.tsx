'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  RENEWAL_DUE: 'bg-orange-100 text-orange-800',
}

const LICENSE_TYPE_LABELS = {
  BASIC: 'Basic',
  STATE: 'State',
  CENTRAL: 'Central',
}

function FSSAIPageContent() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['fssai-licenses', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const response = await fetch(`/api/fssai/licenses?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch FSSAI licenses')
      return response.json()
    },
  })

  const licenses = data?.licenses || []
  const filtered = licenses.filter((l: any) =>
    search === '' ||
    l.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
    l.businessName.toLowerCase().includes(search.toLowerCase())
  )

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FSSAI Licenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage FSSAI licenses and compliance tracking
          </p>
        </div>
        <Link href="/dashboard/fssai/licenses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add License
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search licenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="PENDING">Pending</option>
          <option value="RENEWAL_DUE">Renewal Due</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((license: any) => {
          const daysUntilExpiry = getDaysUntilExpiry(license.expiryDate)
          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
          const isExpired = daysUntilExpiry < 0

          return (
            <Link key={license.id} href={`/dashboard/fssai/licenses/${license.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{license.businessName}</CardTitle>
                      <CardDescription className="mt-1">
                        {license.licenseNumber}
                      </CardDescription>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[license.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {license.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Type: </span>
                      <span className="font-medium">
                        {LICENSE_TYPE_LABELS[license.licenseType as keyof typeof LICENSE_TYPE_LABELS] || license.licenseType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Issue Date: </span>
                      <span className="font-medium">
                        {format(new Date(license.issueDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expiry Date: </span>
                      <span className="font-medium">
                        {format(new Date(license.expiryDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {isExpiringSoon && !isExpired && (
                      <div className="flex items-center gap-2 text-orange-600 pt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">
                          Expires in {daysUntilExpiry} days
                        </span>
                      </div>
                    )}
                    {isExpired && (
                      <div className="flex items-center gap-2 text-red-600 pt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Expired {Math.abs(daysUntilExpiry)} days ago</span>
                      </div>
                    )}
                    {license._count && (
                      <div className="pt-2">
                        <span className="text-gray-500">
                          {license._count.compliances || 0} compliance record(s)
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No FSSAI licenses found</p>
            <Link href="/dashboard/fssai/licenses/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First License
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function FSSAIPage() {
  return <FSSAIPageContent />
}

