'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Upload,
  FilePlus,
  Merge,
  Split,
  Eye,
  Loader2,
  X,
  Download,
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

type PdfTab = 'view' | 'new' | 'merge' | 'split'

/**
 * PayAid PDF – view, new, merge, split. Uses pdf-lib; 100% PayAid UI.
 */
export function PayAidPDFEmbed() {
  const [activeTab, setActiveTab] = useState<PdfTab>('view')
  const [file, setFile] = useState<File | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [mergeFiles, setMergeFiles] = useState<File[]>([])
  const [splitFile, setSplitFile] = useState<File | null>(null)
  const [splitRanges, setSplitRanges] = useState('') // e.g. "1-3, 5, 7-9"
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const viewInputRef = useRef<HTMLInputElement>(null)
  const mergeInputRef = useRef<HTMLInputElement>(null)
  const splitInputRef = useRef<HTMLInputElement>(null)

  const revokeViewUrl = useCallback(() => {
    if (viewUrl) {
      URL.revokeObjectURL(viewUrl)
      setViewUrl(null)
    }
  }, [viewUrl])

  const handleViewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    revokeViewUrl()
    const f = e.target.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setViewUrl(URL.createObjectURL(f))
      setError(null)
    } else {
      setFile(null)
      setError(f ? 'Please select a PDF file.' : null)
    }
  }

  const handleNewPdf = async () => {
    setBusy(true)
    setError(null)
    try {
      const doc = await PDFDocument.create()
      doc.addPage()
      const bytes = await doc.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'PayAid-blank.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PDF')
    } finally {
      setBusy(false)
    }
  }

  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      setError('Select at least 2 PDFs to merge.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const merged = await PDFDocument.create()
      for (const f of mergeFiles) {
        const buf = await f.arrayBuffer()
        const src = await PDFDocument.load(buf)
        const pageCount = src.getPageCount()
        const indices = Array.from({ length: pageCount }, (_, i) => i)
        const copied = await merged.copyPages(src, indices)
        copied.forEach((p) => merged.addPage(p))
      }
      const bytes = await merged.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'PayAid-merged.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs')
    } finally {
      setBusy(false)
    }
  }

  const parseRanges = (s: string, totalPages: number): number[][] => {
    const pages: number[][] = []
    const parts = s.split(/[,;]/).map((p) => p.trim()).filter(Boolean)
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map((n) => parseInt(n.trim(), 10))
        if (!Number.isNaN(a) && !Number.isNaN(b) && a >= 1 && b <= totalPages && a <= b) {
          pages.push(Array.from({ length: b - a + 1 }, (_, i) => a + i))
        }
      } else {
        const n = parseInt(part, 10)
        if (!Number.isNaN(n) && n >= 1 && n <= totalPages) {
          pages.push([n])
        }
      }
    }
    return pages
  }

  const handleSplit = async () => {
    if (!splitFile) {
      setError('Select a PDF to split.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const buf = await splitFile.arrayBuffer()
      const src = await PDFDocument.load(buf)
      const totalPages = src.getPageCount()
      const ranges = parseRanges(splitRanges, totalPages)
      if (ranges.length === 0) {
        setError(`Enter page ranges (e.g. 1-3, 5, 7-9). Document has ${totalPages} page(s).`)
        setBusy(false)
        return
      }
      const zeroBased = ranges.map((r) => r.map((p) => p - 1))
      for (let i = 0; i < zeroBased.length; i++) {
        const indices = zeroBased[i]
        const out = await PDFDocument.create()
        const copied = await out.copyPages(src, indices)
        copied.forEach((p) => out.addPage(p))
        const bytes = await out.save()
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `PayAid-split-${i + 1}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF')
    } finally {
      setBusy(false)
    }
  }

  const clearView = () => {
    revokeViewUrl()
    setFile(null)
    if (viewInputRef.current) viewInputRef.current.value = ''
  }

  const clearMerge = () => {
    setMergeFiles([])
    if (mergeInputRef.current) mergeInputRef.current.value = ''
  }

  const clearSplit = () => {
    setSplitFile(null)
    setSplitRanges('')
    if (splitInputRef.current) splitInputRef.current.value = ''
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileText className="h-7 w-7" />
            PayAid PDF
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View, create, merge, and split PDFs. 100% PayAid — no third-party branding.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PdfTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="view" className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <FilePlus className="h-4 w-4" />
              New
            </TabsTrigger>
            <TabsTrigger value="merge" className="gap-2">
              <Merge className="h-4 w-4" />
              Merge
            </TabsTrigger>
            <TabsTrigger value="split" className="gap-2">
              <Split className="h-4 w-4" />
              Split
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4 mt-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Upload & view</CardTitle>
                <CardDescription>Select a PDF to view in the browser.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="cursor-pointer">
                    <input
                      ref={viewInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleViewFile}
                    />
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Choose PDF
                      </span>
                    </Button>
                  </label>
                  {file && (
                    <>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={clearView}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {viewUrl && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                    <iframe
                      src={viewUrl}
                      title="PDF viewer"
                      className="w-full h-[60vh] min-h-[400px] border-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">New blank PDF</CardTitle>
                <CardDescription>Create a one-page blank PDF and download it.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  onClick={handleNewPdf}
                  disabled={busy}
                  className="gap-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}
                  Create & download
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="merge" className="mt-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Merge PDFs</CardTitle>
                <CardDescription>Select two or more PDFs; they will be merged in order and downloaded.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="cursor-pointer">
                    <input
                      ref={mergeInputRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const list = e.target.files ? Array.from(e.target.files) : []
                        setMergeFiles(list)
                      }}
                    />
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Choose PDFs
                      </span>
                    </Button>
                  </label>
                  {mergeFiles.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearMerge}>
                      Clear
                    </Button>
                  )}
                </div>
                {mergeFiles.length > 0 && (
                  <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {mergeFiles.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                )}
                <Button
                  type="button"
                  onClick={handleMerge}
                  disabled={busy || mergeFiles.length < 2}
                  className="gap-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Merge & download
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="split" className="mt-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Split PDF</CardTitle>
                <CardDescription>Select a PDF and enter page ranges (e.g. 1-3, 5, 7-9). One PDF per range will be downloaded.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="cursor-pointer">
                    <input
                      ref={splitInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setSplitFile(e.target.files?.[0] ?? null)}
                    />
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Choose PDF
                      </span>
                    </Button>
                  </label>
                  {splitFile && (
                    <>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{splitFile.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={clearSplit}>
                        Clear
                      </Button>
                    </>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Page ranges
                  </label>
                  <Input
                    placeholder="e.g. 1-3, 5, 7-9"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSplit}
                  disabled={busy || !splitFile || !splitRanges.trim()}
                  className="gap-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Split & download
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
