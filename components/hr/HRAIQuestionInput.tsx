'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Send, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { useAuthStore } from '@/lib/stores/auth'

interface HRAIQuestionInputProps {
  tenantId?: string
}

const QUICK_PROMPTS = [
  'Why is turnover rate increasing?',
  'What are my top retention risks?',
  'Which employees need training?',
  'Show me payroll compliance status',
]

export function HRAIQuestionInput({ tenantId }: HRAIQuestionInputProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const { logout } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !tenantId) return

    setLoading(true)
    setResponse(null)

    try {
      // Call AI chat API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: question,
          context: {
            module: 'hr',
            tenantId,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data.response || 'No response received')
      } else if (res.status === 401) {
        logout()
      } else {
        setResponse('Error: Could not get AI response. Please try again.')
      }
    } catch (error) {
      console.error('AI query error:', error)
      setResponse('Error: Could not connect to AI service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setQuestion(prompt)
    // Auto-submit quick prompts
    setTimeout(() => {
      const form = document.createElement('form')
      form.submit = handleSubmit as any
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }, 100)
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-purple-50/30" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardContent className="p-4" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Ask AI about your HR</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Why is turnover rate increasing?"
              className="flex-1 text-xs h-8"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !question.trim()} size="sm" className="h-8">
              <Send className="h-3 w-3 mr-1" />
              Ask
            </Button>
          </div>
        </form>

        <div className="space-y-1 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Lightbulb className="h-3 w-3" />
            <span>Quick prompts:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_PROMPTS.slice(0, 2).map((prompt, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-purple-100 hover:border-purple-300 text-xs px-2 py-0.5"
                onClick={() => handleQuickPrompt(prompt)}
              >
                {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[140px] mt-1">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            </div>
          )}
          {response && !loading && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-gray-700">
              {response}
            </div>
          )}
          {!response && !loading && (
            <div className="text-center py-8 text-gray-400 text-xs">
              Ask a question to get AI-powered insights about your HR data
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
