'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AIContentGeneratorProps {
  organizationId: string
  industry: string
}

export function AIContentGenerator({ organizationId, industry }: AIContentGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState<'email' | 'social_post' | 'product_description' | 'landing_page_copy'>('email')
  const [tone, setTone] = useState<'professional' | 'casual' | 'technical' | 'creative'>('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function generateContent() {
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/marketing/ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (data.success) {
        setGeneratedContent(data.data.generatedContent)
      } else {
        alert('Failed to generate content')
      }
    } catch (error) {
      console.error('Failed to generate content:', error)
      alert('Failed to generate content')
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

        {generatedContent && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
            <h3 className="font-medium mb-2">Generated Content:</h3>
            <p className="whitespace-pre-wrap">{generatedContent}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigator.clipboard.writeText(generatedContent)}
            >
              Copy to Clipboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
