'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, ArrowLeft, Send, Sparkles } from 'lucide-react'

const SUGGESTED_CHIPS = [
  "Why was my TDS ₹12,500 this month?",
  "Show Priya's salary breakup",
  "When is my next reimbursement due?",
  "What are my PF contributions YTD?",
  "Compare this month vs last month net pay",
]

export default function PayrollAIPayslipPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])

  const sendMessage = (text: string) => {
    const t = text.trim()
    if (!t) return
    setMessages((m) => [...m, { role: 'user', text: t }])
    setQuery('')
    // Placeholder: in production, call API with tenant + payroll context and stream response
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "I can only help with your company's payroll data on this page. For employee-specific answers, ensure you're asking about data we have (e.g. salary breakup, TDS, PF). Try: 'Show salary breakup for [employee name]' or 'Why was TDS X for this month?'",
        },
      ])
    }, 600)
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/hr/${tenantId}/Payroll`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            AI Payslip Assistant
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask about any employee&apos;s salary, TDS, PF, reimbursements — India payroll context
          </p>
        </div>
      </div>

      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            XPayroll AI — Ask about any employee&apos;s salary
          </CardTitle>
          <CardDescription>
            Employee-specific context; answers only from this tenant&apos;s payroll data.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                className="px-3 py-1.5 rounded-full text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="min-h-[200px] space-y-3 max-h-[320px] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                Type a question or tap a suggestion above. I only answer using this company&apos;s
                payroll data.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Ask about salary, TDS, PF, reimbursement..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(query)}
              className="flex-1 rounded-xl"
            />
            <Button
              type="button"
              onClick={() => sendMessage(query)}
              disabled={!query.trim()}
              size="icon"
              className="rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
