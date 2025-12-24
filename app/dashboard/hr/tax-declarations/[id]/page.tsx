'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface TaxProofDocument {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  verificationStatus: string
  uploadedAt: string
}

interface TaxDeclaration {
  id: string
  financialYear: string
  declaredAmountInr: number
  approvedAmountInr?: number
  status: string
  rejectionReason?: string
  verifiedAt?: string
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
  }
  category: {
    id: string
    name: string
    code: string
    maxAmountInr?: number
  }
  proofDocuments: TaxProofDocument[]
  createdAt: string
}

export default function TaxDeclarationDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approvedAmount, setApprovedAmount] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: declaration, refetch } = useQuery<TaxDeclaration>({
    queryKey: ['tax-declaration', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/tax-declarations/${id}`)
      if (!response.ok) throw new Error('Failed to fetch tax declaration')
      return response.json()
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (amount?: number) => {
      const response = await fetch(`/api/hr/tax-declarations/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedAmountInr: amount,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve declaration')
      }
      return response.json()
    },
    onSuccess: () => {
      setShowApproveDialog(false)
      refetch()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch(`/api/hr/tax-declarations/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: reason,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject declaration')
      }
      return response.json()
    },
    onSuccess: () => {
      setShowRejectDialog(false)
      refetch()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (!declaration) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Declaration</h1>
          <p className="mt-2 text-gray-600">{declaration.category.name} - {declaration.financialYear}</p>
        </div>
        <Link href="/dashboard/hr/tax-declarations">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      {/* Declaration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Declaration Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Employee</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {declaration.employee.employeeCode} - {declaration.employee.firstName} {declaration.employee.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {declaration.category.name} ({declaration.category.code})
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Financial Year</dt>
              <dd className="mt-1 text-sm text-gray-900">{declaration.financialYear}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(declaration.status)}`}>
                  {declaration.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Declared Amount</dt>
              <dd className="mt-1 text-sm text-gray-900">
                ₹{Number(declaration.declaredAmountInr).toLocaleString('en-IN')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Approved Amount</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {declaration.approvedAmountInr
                  ? `₹${Number(declaration.approvedAmountInr).toLocaleString('en-IN')}`
                  : '-'}
              </dd>
            </div>
            {declaration.rejectionReason && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
                <dd className="mt-1 text-sm text-red-600">{declaration.rejectionReason}</dd>
              </div>
            )}
            {declaration.verifiedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Verified At</dt>
                <dd className="mt-1 text-sm text-gray-900">{format(new Date(declaration.verifiedAt), 'PPp')}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Proof Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Proof Documents ({declaration.proofDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {declaration.proofDocuments.length === 0 ? (
            <p className="text-gray-500 text-sm">No proof documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {declaration.proofDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {doc.fileType} • {format(new Date(doc.uploadedAt), 'PPp')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      doc.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.verificationStatus}
                    </span>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">View</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {declaration.status === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {showApproveDialog ? (
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approved Amount ₹ (leave empty to approve declared amount)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder={Number(declaration.declaredAmountInr).toString()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const amount = approvedAmount ? parseFloat(approvedAmount) : undefined
                        approveMutation.mutate(amount)
                      }}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : showRejectDialog ? (
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => rejectMutation.mutate(rejectionReason)}
                      disabled={rejectMutation.isPending || !rejectionReason}
                      variant="destructive"
                    >
                      {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button onClick={() => setShowApproveDialog(true)}>Approve</Button>
                  <Button onClick={() => setShowRejectDialog(true)} variant="destructive">
                    Reject
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
