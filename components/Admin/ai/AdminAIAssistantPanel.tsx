'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'

interface AdminAIAssistantPanelProps {
  context?: 'overview' | 'modules'
}

export function AdminAIAssistantPanel({ context = 'overview' }: AdminAIAssistantPanelProps) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleExplain = () => {
    setLoading(true)
    setSummary(null)
    setTimeout(() => {
      setSummary(
        context === 'overview'
          ? 'Your team has 3 users. CRM and Finance are enabled. Consider enabling Workflows to automate follow-ups.'
          : 'Based on your industry and usage, enabling Workflows and AI Sequences could reduce manual follow-ups.'
      )
      setLoading(false)
    }, 800)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4" />
          AI configuration assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Get plain-English explanations and suggestions for roles and modules.
        </p>
        <Button variant="outline" size="sm" onClick={handleExplain} disabled={loading}>
          {loading ? 'Thinking…' : 'Explain & suggest'}
        </Button>
        {summary && (
          <p className="text-sm border-l-2 pl-3 text-muted-foreground">{summary}</p>
        )}
      </CardContent>
    </Card>
  )
}
