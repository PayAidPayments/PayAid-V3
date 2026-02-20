'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Send, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { useAuthStore } from '@/lib/stores/auth'

interface AIQuestionInputProps {
  tenantId?: string
}

const QUICK_PROMPTS = [
  'Why is Q3 revenue down vs Q2?',
  'What are my top 3 deals to focus on?',
  'Which leads have the highest conversion probability?',
  'Show me churn risks this month',
]

export function AIQuestionInput({ tenantId }: AIQuestionInputProps) {
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
            module: 'crm',
            tenantId,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data.message || data.response || 'Response received')
      } else {
        // Parse error response
        let errorMessage = 'Unable to process question at this time. Please try again.'
        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          
          // Handle 401 errors (invalid/expired token)
          if (res.status === 401 || errorData.code === 'INVALID_TOKEN') {
            errorMessage = 'Your session has expired. Please log out and log back in.'
            // Auto-logout and redirect after a short delay
            setTimeout(() => {
              logout()
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            }, 2000)
          } else if (res.status === 403 || errorData.code === 'MODULE_NOT_LICENSED') {
            errorMessage = 'AI Studio module is not enabled. Please enable it to use the AI assistant.'
          }
        } catch (parseError) {
          console.error('[AIQuestionInput] Failed to parse error response:', parseError)
          // Keep default error message
        }
        setResponse(errorMessage)
      }
    } catch (error) {
      console.error('[AIQuestionInput] Error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Error processing your question. Please try again.'
      setResponse(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setQuestion(prompt)
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-purple-50/30" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardContent className="p-4" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Ask AI about your funnel</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Why is Q3 revenue down?"
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

        <div className="flex-1 overflow-y-auto min-h-[140px] mt-1" style={{ maxHeight: 'none' }}>
          {response && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">AI Response:</p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words">{response}</p>
            </div>
          )}

          {loading && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyzing your question...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
