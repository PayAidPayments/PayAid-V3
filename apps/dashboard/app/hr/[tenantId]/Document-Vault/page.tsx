'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FolderOpen, FileText, Loader2, Check } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Doc = {
  id: string
  employeeId: string
  documentType: string
  fileUrl: string
  generatedAt: string
  createdAt: string
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string }
}

type ChecklistItem = {
  employeeId: string
  presentCount: number
  expectedCount: number
  missingTypes: string[]
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string }
}

const EXPECTED_TYPES_LABELS: Record<string, string> = {
  OFFER_LETTER: 'Offer Letter',
  PAN_CARD: 'PAN Card',
  AADHAAR: 'Aadhaar',
  FORM_16: 'Form 16',
  RELIEVING_LETTER: 'Relieving Letter',
  EXPERIENCE_LETTER: 'Experience Letter',
}

export default function DocumentVaultPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [documents, setDocuments] = useState<Doc[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !token) return
    const timeoutId = globalThis.setTimeout(() => {
      setLoading(true)
      fetch(`/api/hr/documents?limit=200`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { documents: [], checklist: [] }))
        .then((data) => {
          setDocuments(data.documents || [])
          setChecklist(data.checklist || [])
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => globalThis.clearTimeout(timeoutId)
  }, [tenantId, token])

  const empName = (e: { firstName: string; lastName: string } | undefined) =>
    e ? `${e.firstName} ${e.lastName}`.trim() : '—'

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/hr/${tenantId}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Document Vault</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Employee document checklist & central repository</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="dark:border-slate-600 dark:text-slate-300" disabled>
            Upload document
          </Button>
        </div>
      </div>

      {/* Document checklist by employee */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Check className="h-4 w-4" /> Document checklist
          </CardTitle>
          <CardDescription className="text-xs">Expected vs present per employee (v1)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : checklist.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No employees in scope. Add documents to see checklist.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800">
                    <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Code</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Missing</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400 w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklist.slice(0, 50).map((c) => (
                    <TableRow key={c.employeeId} className="border-slate-200 dark:border-slate-800">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{empName(c.employee)}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{c.employee?.employeeCode ?? '—'}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {c.presentCount}/{c.expectedCount} docs
                        </span>
                        {c.presentCount >= c.expectedCount ? (
                          <Badge className="ml-2 bg-green-600 text-xs">Complete</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2 text-xs dark:bg-slate-700">Incomplete</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                        {c.missingTypes.length === 0
                          ? '—'
                          : c.missingTypes.map((t) => EXPECTED_TYPES_LABELS[t] || t).join(', ')}
                      </TableCell>
                      <TableCell>
                        <Link href={`/hr/${tenantId}/Employees/${c.employeeId}`}>
                          <Button variant="ghost" size="sm" className="text-xs dark:text-slate-400">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All documents */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> All documents
          </CardTitle>
          <CardDescription className="text-xs">Central list of uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents yet</p>
              <p className="text-sm mt-1">Upload offer letters, Form 16, and other docs to see them here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400 w-[80px]">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">{empName(d.employee)}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {EXPECTED_TYPES_LABELS[d.documentType] || d.documentType}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                      {format(new Date(d.generatedAt || d.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {d.fileUrl ? (
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">
                          Open
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
