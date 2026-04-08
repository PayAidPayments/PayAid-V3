'use client'

import { useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import { Upload, FileText, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

const CATEGORIES = [
  'OFFER_LETTER',
  'NDA',
  'POLICY',
  'CONTRACT',
  'TAX_DECLARATION',
  'FORM_16',
  'OTHER',
]

export default function HRDocumentsUploadPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadDocumentIdempotencyKey = useMemo(
    () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `hr:document:upload:${crypto.randomUUID()}`
        : `hr:document:upload:${Date.now()}`,
    []
  )

  const [formData, setFormData] = useState({
    documentName: '',
    category: 'OTHER',
    employeeId: '',
    requiresSignature: false,
  })
  const [file, setFile] = useState<File | null>(null)

  const { data: employeesData } = useQuery({
    queryKey: ['hr-employees-list', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=500', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      return data.employees ?? []
    },
  })
  const employees = employeesData ?? []

  const uploadDoc = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.append('documentName', formData.documentName || (file?.name ?? 'Document'))
      form.append('category', formData.category)
      if (formData.employeeId) form.append('employeeId', formData.employeeId)
      form.append('requiresSignature', String(formData.requiresSignature))
      if (file) form.append('file', file)

      const res = await fetch('/api/hr/documents', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': uploadDocumentIdempotencyKey,
        },
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Upload failed')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Documents`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    uploadDoc.mutate()
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Upload Document"
        moduleIcon={<Upload className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Add document to vault (e-sign optional)"
      />

      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Upload a file and optionally require e-signature from an employee</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="documentName">Document Name *</Label>
                <Input
                  id="documentName"
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                  placeholder="e.g. Offer Letter - John Doe"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <CustomSelect
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                  placeholder="Select category"
                >
                  <CustomSelectTrigger />
                  <CustomSelectContent>
                    {CATEGORIES.map((c) => (
                      <CustomSelectItem key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div>
                <Label htmlFor="employeeId">Assign to Employee (optional)</Label>
                <CustomSelect
                  value={formData.employeeId}
                  onValueChange={(v) => setFormData({ ...formData, employeeId: v })}
                  placeholder="Select employee"
                >
                  <CustomSelectTrigger />
                  <CustomSelectContent>
                    <CustomSelectItem value="">None</CustomSelectItem>
                    {employees.map((emp: any) => (
                      <CustomSelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="requiresSignature" className="font-medium">Require E-Signature</Label>
                  <p className="text-sm text-muted-foreground">Employee must e-sign this document</p>
                </div>
                <Switch
                  id="requiresSignature"
                  checked={formData.requiresSignature}
                  onCheckedChange={(c) => setFormData({ ...formData, requiresSignature: c })}
                />
              </div>

              <div>
                <Label>File *</Label>
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div>
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="font-medium">Click to select file</p>
                      <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, PNG, JPG</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href={`/hr/${tenantId}/Documents`}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadDoc.isPending}
                    title={uploadDoc.isPending ? 'Please wait' : 'Cancel and return'}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={!file || uploadDoc.isPending}
                  title={uploadDoc.isPending ? 'Please wait' : 'Upload document'}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {uploadDoc.isPending ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
