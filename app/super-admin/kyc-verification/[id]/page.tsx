'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

interface KYCDocumentDetail {
  id: string
  tenantId: string
  documentType: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  ocrData: any
  verificationStatus: string
  verifiedById: string | null
  verifiedAt: string | null
  notes: string | null
  rejectionReason: string | null
  createdAt: string
  tenant: {
    id: string
    name: string
    email: string | null
  }
  onboarding: {
    id: string
    status: string
    kycStatus: string
  } | null
}

export default function KYCDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  const [data, setData] = useState<KYCDocumentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [action, setAction] = useState<'verify' | 'reject' | 'needs_review' | null>(null)
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  const fetchDocument = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/kyc-documents/${documentId}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json.data)
      setNotes(json.data.notes || '')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!action) return

    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        variant: 'destructive',
      })
      return
    }

    setActionLoading(true)
    try {
      const body: any = {
        verificationStatus: action,
        notes,
      }

      if (action === 'reject') {
        body.rejectionReason = rejectionReason
      }

      const res = await fetch(`/api/super-admin/kyc-documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast({
        title: 'Success',
        description: `Document ${action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'flagged for review'}`,
      })

      router.push('/super-admin/kyc-verification')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document status',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
      setAction(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary' as const, icon: AlertCircle, label: 'Pending' },
      verified: { variant: 'default' as const, icon: CheckCircle, label: 'Verified' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      needs_review: { variant: 'outline' as const, icon: FileText, label: 'Needs Review' },
    }
    const config = variants[status] || { variant: 'secondary' as const, icon: AlertCircle, label: status }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="text-sm px-3 py-1">
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pan: 'PAN Card',
      aadhaar: 'Aadhaar Card',
      bank_statement: 'Bank Statement',
      gst_certificate: 'GST Certificate',
      incorporation_certificate: 'Incorporation Certificate',
      address_proof: 'Address Proof',
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  const isPDF = (mimeType: string) => {
    return mimeType === 'application/pdf'
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!data) {
    return (
      <div className="p-6">
        <p>Document not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/super-admin/kyc-verification">Back to Documents</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/kyc-verification">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{getDocumentTypeLabel(data.documentType)}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(data.verificationStatus)}
              <span className="text-sm text-muted-foreground">{data.tenant.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Document Viewer */}
        <div className="md:col-span-2 space-y-6">
          {/* Document Viewer */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Preview
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <a href={data.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[500px] flex items-center justify-center">
                {isImage(data.mimeType) ? (
                  <img
                    src={data.fileUrl}
                    alt={data.fileName}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : isPDF(data.mimeType) ? (
                  <iframe
                    src={data.fileUrl}
                    className="w-full h-[500px] border-0"
                    title={data.fileName}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p>Preview not available</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <a href={data.fileUrl} target="_blank" rel="noopener noreferrer">
                        Open Document
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* OCR Data */}
          {data.ocrData && (
            <Card>
              <CardHeader>
                <CardTitle>OCR Extraction Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ocrData.extractedText && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Extracted Text</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-mono max-h-48 overflow-y-auto">
                        {data.ocrData.extractedText}
                      </div>
                    </div>
                  )}
                  {data.ocrData.fields && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Extracted Fields</Label>
                      <div className="space-y-2">
                        {Object.entries(data.ocrData.fields).map(([key, value]) => (
                          <div key={key} className="flex justify-between p-2 border rounded">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">File Name</Label>
                  <p className="font-medium">{data.fileName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p className="font-medium">{formatFileSize(data.fileSize)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Type</Label>
                  <p className="font-medium">{data.mimeType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploaded</Label>
                  <p className="font-medium">{new Date(data.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification History */}
          {data.verifiedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Verified At:</span>{' '}
                    {new Date(data.verifiedAt).toLocaleString()}
                  </div>
                  {data.rejectionReason && (
                    <div>
                      <span className="text-muted-foreground">Rejection Reason:</span>{' '}
                      <span className="text-red-600">{data.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this document..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          {data.verificationStatus === 'pending' || data.verificationStatus === 'needs_review' ? (
            <Card>
              <CardHeader>
                <CardTitle>Verification Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {action === null ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => setAction('verify')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Document
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setAction('reject')}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Document
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setAction('needs_review')}
                      disabled={actionLoading}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Flag for Review
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    {action === 'reject' && (
                      <div>
                        <Label>Rejection Reason *</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this document is being rejected..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleAction}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Confirm'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAction(null)
                          setRejectionReason('')
                        }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This document has been {data.verificationStatus}. No further actions available.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
