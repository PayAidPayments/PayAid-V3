'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api/client'
import { WEBSITE_BUILDER_INDUSTRIES } from '@/lib/ai/website-builder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function WebsiteBuilderV2Page() {
  const [industry, setIndustry] = useState<string>('services')
  const [businessName, setBusinessName] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ components: Array<{ componentName: string; code: string }>; provider: string } | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await apiRequest('/api/websites/generate/v2', {
        method: 'POST',
        body: JSON.stringify({
          industry,
          businessName: businessName.trim() || 'Our Business',
          oneLiner: oneLiner.trim() || 'Professional services for Indian SMBs.',
          style: 'modern',
          framework: 'nextjs',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Generation failed')
        return
      }
      setResult({
        components: (data.components ?? []).map((c: { componentName: string; code: string }) => ({ componentName: c.componentName, code: c.code })),
        provider: data.provider ?? 'none',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Website Builder v2</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Industry-tuned landing page in ~60s. India SMB only. All amounts in ₹ INR.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate your site</CardTitle>
            <CardDescription>Choose industry, business name, and one-line description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Industry</Label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              >
                {WEBSITE_BUILDER_INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Business name</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. ABC Retail"
                className="mt-1"
              />
            </div>
            <div>
              <Label>One-line description</Label>
              <Input
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="e.g. GST-ready billing and local delivery"
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={loading ? 'ml-2' : ''}>{loading ? 'Generating your site…' : 'Generate'}</span>
            </Button>
          </CardContent>
        </Card>

        {result && result.components.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Provider: {result.provider}. {result.components.length} component(s).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.components.map((c) => (
                  <div key={c.componentName} className="rounded border dark:border-gray-700 p-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{c.componentName}</p>
                    <pre className="text-xs overflow-x-auto bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {c.code.slice(0, 2000)}{c.code.length > 2000 ? '…' : ''}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
