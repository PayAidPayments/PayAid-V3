'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { CopyAction, COPY_ACTION_PRESETS } from '@/components/ui/copy-action'

interface AIContentGeneratorProps {
  organizationId: string
  industry: string
}

export function AIContentGenerator({ organizationId, industry }: AIContentGeneratorProps) {
  const { token } = useAuthStore()
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState<'email' | 'social_post' | 'product_description' | 'landing_page_copy'>('email')
  const [tone, setTone] = useState<'professional' | 'casual' | 'technical' | 'creative'>('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateContent() {
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/marketing/ai-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organizationId,
          contentType,
          prompt,
          industry,
          tone,
          includesCallToAction: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setGeneratedContent(data.data.generatedContent)
      } else {
        setError(data.error?.message || data.message || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Failed to generate content:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold">AI Content Generator</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as typeof contentType)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="email">Email</option>
            <option value="social_post">Social Post</option>
            <option value="product_description">Product Description</option>
            <option value="landing_page_copy">Landing Page Copy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="technical">Technical</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what content you want to generate..."
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            rows={4}
          />
        </div>

        <Button onClick={generateContent} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Content'}
        </Button>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {generatedContent && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
            <h3 className="font-medium mb-2">Generated Content:</h3>
            <p className="whitespace-pre-wrap">{generatedContent}</p>
            <CopyAction
              textToCopy={generatedContent}
              successMessage="Generated content copied to clipboard."
              label="Copy to Clipboard"
              copiedLabel="Copied"
              buttonProps={{ variant: 'outline', size: 'sm', className: 'mt-2' }}
              {...COPY_ACTION_PRESETS.compactSettings}
            />
          </div>
        )}
      </div>
    </div>
  )
}
