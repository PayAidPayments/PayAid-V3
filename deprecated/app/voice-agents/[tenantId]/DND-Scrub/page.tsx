'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Upload, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DNDScrubPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ dnd: string[]; nonDnd: string[]; dndCount: number; nonDndCount: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('auth-token')
      : null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a CSV file')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.set('file', file)
      const token = getToken()
      const res = await fetch('/api/v1/voice-agents/campaigns/dnd-scrub', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Scrub failed')
        return
      }
      setResult({
        dnd: data.dnd || [],
        nonDnd: data.nonDnd || [],
        dndCount: data.dndCount ?? 0,
        nonDndCount: data.nonDndCount ?? 0,
        total: data.total ?? 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadCsv = (rows: string[], filename: string) => {
    const csv = 'phone\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/voice-agents/${tenantId}/Home`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            DND Scrub (TRAI compliance)
          </CardTitle>
          <CardDescription>
            Upload a CSV with a &quot;phone&quot; column (or numbers in the first column). We&apos;ll split the list into DND and non-DND. Use non-DND for voice campaigns; use DND for SMS fallback or exclude.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {file ? file.name : 'Choose CSV'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !file}
            >
              {loading ? 'Scrubbing…' : 'Scrub numbers'}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {result && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <p className="text-sm font-medium">
                Total: {result.total} — DND: {result.dndCount} — Non-DND: {result.nonDndCount}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCsv(result.nonDnd, 'non_dnd.csv')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download non-DND (use for calls)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCsv(result.dnd, 'dnd.csv')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download DND
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
