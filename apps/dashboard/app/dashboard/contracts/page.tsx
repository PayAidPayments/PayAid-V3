'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, FileText, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'

const CONTRACT_STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  TERMINATED: 'bg-gray-100 text-gray-800',
}

const CONTRACT_TYPE_LABELS = {
  SERVICE: 'Service',
  SALES: 'Sales',
  PURCHASE: 'Purchase',
  EMPLOYMENT: 'Employment',
  NDA: 'NDA',
  OTHER: 'Other',
}

function ContractsPageContent() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('contractType', typeFilter)
      const response = await fetch(`/api/contracts?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch contracts')
      return response.json()
    },
  })

  const contracts = data?.contracts || []
  const filteredContracts = contracts.filter((c: any) =>
    search === '' ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.contractNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.partyName.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your contracts and agreements
          </p>
        </div>
        <Link href="/dashboard/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Contract
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          <select
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Types</option>
            <option value="SERVICE">Service</option>
            <option value="SALES">Sales</option>
            <option value="PURCHASE">Purchase</option>
            <option value="EMPLOYMENT">Employment</option>
            <option value="NDA">NDA</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map((contract: any) => (
          <Link key={contract.id} href={`/dashboard/contracts/${contract.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contract.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {contract.contractNumber || 'No number'}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${CONTRACT_STATUS_COLORS[contract.status as keyof typeof CONTRACT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {contract.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Type: </span>
                    <span className="font-medium">
                      {CONTRACT_TYPE_LABELS[contract.contractType as keyof typeof CONTRACT_TYPE_LABELS] || contract.contractType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Party: </span>
                    <span className="font-medium">{contract.partyName}</span>
                  </div>
                  {contract.value && (
                    <div>
                      <span className="text-gray-500">Value: </span>
                      <span className="font-medium">
                        {contract.currency} {Number(contract.value).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {contract.startDate && (
                    <div>
                      <span className="text-gray-500">Start: </span>
                      <span className="font-medium">
                        {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {contract.endDate && (
                    <div>
                      <span className="text-gray-500">End: </span>
                      <span className="font-medium">
                        {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    {contract.signatures && contract.signatures.length > 0 ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">{contract.signatures.length} signed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Pending signature</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contracts found</p>
            <Link href="/dashboard/contracts/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Contract
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ContractsPage() {
  return <ContractsPageContent />
}

