'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, CheckCircle, XCircle, Clock, FileText, Eye } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

interface KYCDocument {
  id: string
  tenantId: string
  tenant: {
    id: string
    name: string
    email: string | null
  }
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
  onboarding: {
    id: string
    status: string
    kycStatus: string
  } | null
}

export default function SuperAdminKYCVerificationPage() {
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [statusFilter])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const url = `/api/super-admin/kyc-documents${statusFilter !== 'all' ? `?verificationStatus=${statusFilter}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setDocuments(json.data || [])
      setStats(json.stats)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load KYC documents',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter((d) =>
    d.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      verified: { variant: 'default' as const, icon: CheckCircle, label: 'Verified' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      needs_review: { variant: 'outline' as const, icon: FileText, label: 'Needs Review' },
    }
    const config = variants[status] || { variant: 'secondary' as const, icon: Clock, label: status }
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Document Verification</h1>
        <p className="text-muted-foreground">Review and verify merchant KYC documents</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="needs_review">Needs Review</option>
        </select>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No documents found
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{getDocumentTypeLabel(doc.documentType)}</h3>
                      {getStatusBadge(doc.verificationStatus)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Merchant:</span> {doc.tenant.name}
                      </div>
                      <div>
                        <span className="font-medium">File:</span> {doc.fileName}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {formatFileSize(doc.fileSize)}
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span>{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {doc.ocrData && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">OCR Data:</span>{' '}
                        <span className="text-muted-foreground">
                          {doc.ocrData.extractedText
                            ? `${doc.ocrData.extractedText.substring(0, 100)}...`
                            : 'Available'}
                        </span>
                      </div>
                    )}
                    {doc.rejectionReason && (
                      <div className="mt-2 text-sm text-red-600">
                        <span className="font-medium">Rejection Reason:</span> {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/super-admin/kyc-verification/${doc.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
