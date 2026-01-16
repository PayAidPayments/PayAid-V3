'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, Clock, Download, Send } from 'lucide-react'
import { format } from 'date-fns'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const contractId = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch contract')
      return response.json()
    },
  })

  const signContract = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error('Failed to sign contract')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading contract..." fullScreen={false} />
  }

  const contract = data?.contract
  if (!contract) {
    return <div>Contract not found</div>
  }

  const signatures = contract.signatures || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contracts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{contract.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {contract.contractNumber || 'No contract number'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {contract.status === 'DRAFT' && (
            <Button onClick={() => signContract.mutate()} disabled={signContract.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {signContract.isPending ? 'Signing...' : 'Sign Contract'}
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              // Open e-signature modal
              const modal = document.getElementById('esignature-modal')
              if (modal) {
                (modal as any).showModal()
              }
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Send for E-Signature
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                  {contract.status}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Type</label>
              <div className="mt-1 font-medium">{contract.contractType}</div>
            </div>
            {contract.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <div className="mt-1">{contract.description}</div>
              </div>
            )}
            {contract.value && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Value</label>
                <div className="mt-1 font-medium">
                  {contract.currency} {Number(contract.value).toLocaleString()}
                </div>
              </div>
            )}
            {contract.startDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Start Date</label>
                <div className="mt-1">
                  {format(new Date(contract.startDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {contract.endDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500">End Date</label>
                <div className="mt-1">
                  {format(new Date(contract.endDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Party Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <div className="mt-1 font-medium">{contract.partyName}</div>
            </div>
            {contract.partyEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1">{contract.partyEmail}</div>
              </div>
            )}
            {contract.partyPhone && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <div className="mt-1">{contract.partyPhone}</div>
              </div>
            )}
            {contract.partyAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1">{contract.partyAddress}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
          <CardDescription>
            {signatures.length > 0
              ? `${signatures.length} signature(s) collected`
              : 'No signatures yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length > 0 ? (
            <div className="space-y-3">
              {signatures.map((sig: any) => (
                <div
                  key={sig.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">{sig.signerName}</div>
                    <div className="text-sm text-gray-500">
                      {sig.signerRole} • {format(new Date(sig.signedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No signatures yet. Send this contract for signature to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {contract.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{contract.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

