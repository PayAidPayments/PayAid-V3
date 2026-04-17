'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Mic, MicOff, Loader2, Minus } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useCurrentPageContext } from '@/lib/hooks/useCurrentPageContext'
import { usePageAIExtraStore } from '@/lib/stores/page-ai-extra'
import { cn } from '@/lib/utils/cn'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ActionLevel = 'read' | 'draft' | 'guarded_write' | 'restricted'

interface Specialist {
  id: string
  name: string
  promise: string
  promptChips: string[]
}

function buildErrorMessage(status: number, data: { message?: string; error?: string; hint?: string }): string {
  const serverMessage = data?.message || data?.error
  const hint = data?.hint
  if (status === 401) return 'Please sign in again to use the AI assistant.'
  if (status === 403) return serverMessage || "You don't have access to the AI assistant."
  if (status === 409) return serverMessage || 'Approval is required before running this action mode.'
  if (status === 400) return serverMessage || "Your message couldn't be processed. Please rephrase."
  if (serverMessage || hint) return [serverMessage, hint].filter(Boolean).join('\n\n')
  return "I couldn't get a response right now. Please try again."
}

/** Default entities label per module for greeting */
const moduleEntities: Record<string, string> = {
  crm: 'contacts, deals, or campaigns',
  finance: 'invoices, billing, or vendors',
  hr: 'employees, attendance, or payroll',
  marketing: 'campaigns, segments, or analytics',
  sales: 'orders, checkout, or landing pages',
  inventory: 'products, stock, or warehouses',
  projects: 'tasks, projects, or time',
  analytics: 'dashboards or reports',
  general: 'your data here',
}

/**
 * Page-scoped AI assistant for the unified shell. Required on every page.
 * Uses current route + tenant name; AI only answers about this company's data on this page.
 */
export function PageAIAssistant() {
  const ctx = useCurrentPageContext()
  const pageExtra = usePageAIExtraStore((s) => s.extra)
  const { token, tenant } = useAuthStore()
  const businessName = tenant?.name || 'Your company'
  const moduleLabel = ctx.module.charAt(0).toUpperCase() + ctx.module.slice(1).replace(/-/g, ' ')
  const pageLabel = ctx.page.replace(/-/g, ' ')
  const entities = moduleEntities[ctx.module] || moduleEntities.general

  const [isOpen, setIsOpen] = useState(false)
  const greeting = `Hi! I'm PayAid AI for ${businessName}'s ${moduleLabel} ${pageLabel}. Ask me about your ${entities}.`
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [specialistId, setSpecialistId] = useState('')
  const [actionLevel, setActionLevel] = useState<ActionLevel>('read')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedSpecialist = useMemo(
    () => specialists.find((specialist) => specialist.id === specialistId),
    [specialists, specialistId]
  )
  const requiresApproval = actionLevel === 'guarded_write' || actionLevel === 'restricted'

  // Keep greeting in sync when tenant/module/page changes (e.g. after nav)
  useEffect(() => {
    const nextGreeting = `Hi! I'm PayAid AI for ${businessName}'s ${moduleLabel} ${pageLabel}. Ask me about your ${entities}.`
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === 'assistant'
        ? [{ ...prev[0], content: nextGreeting }]
        : prev
    )
  }, [businessName, moduleLabel, pageLabel, entities])

  useEffect(() => {
    let cancelled = false

    async function loadSpecialists() {
      if (!token) return
      try {
        const response = await fetch(`/api/ai/specialists?module=${encodeURIComponent(ctx.module)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return
        const data = (await response.json()) as { specialists?: Specialist[] }
        if (cancelled) return
        const list = Array.isArray(data.specialists) ? data.specialists : []
        setSpecialists(list)
        if (list.length > 0 && (!specialistId || !list.some((specialist) => specialist.id === specialistId))) {
          setSpecialistId(list[0]!.id)
        }
      } catch {
        // Keep assistant functional if specialist listing fails.
      }
    }

    loadSpecialists()
    return () => {
      cancelled = true
    }
  }, [ctx.module, specialistId, token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Global event to open panel (e.g. from dashboard CTA)
  useEffect(() => {
    const handler = () => {
      setIsOpen(true)
      setIsMinimized(false)
    }
    window.addEventListener('open-page-ai', handler)
    return () => window.removeEventListener('open-page-ai', handler)
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    let approvalConfirmed = false
    if (requiresApproval) {
      approvalConfirmed = window.confirm(
        actionLevel === 'restricted'
          ? 'Restricted mode can trigger high-impact actions. Confirm you want to continue.'
          : 'Guarded write mode can propose write actions. Confirm you want to continue.'
      )
      if (!approvalConfirmed) return
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    if (!token) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Please sign in to use the AI assistant.', timestamp: new Date() },
      ])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            module: ctx.module,
            page: ctx.page,
            tenantId: ctx.tenantId,
            businessName,
            entities: (moduleEntities[ctx.module] || 'data on this page').split(/, | or /).map((s) => s.trim()).filter(Boolean),
            ...(pageExtra && typeof pageExtra === 'object' ? { pageExtra } : {}),
            specialistId,
            actionLevel,
            approvalConfirmed,
            sessionId: crypto.randomUUID(),
          },
        }),
      })
      let data: { message?: string; error?: string; hint?: string } = {}
      try {
        const text = await response.text()
        if (text) data = JSON.parse(text) as typeof data
      } catch {
        // ignore
      }
      const content = response.ok
        ? (data.message || "I couldn't process that. Please try again.")
        : buildErrorMessage(response.status, data)
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date() },
      ])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I couldn't reach the AI service. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(true); setIsMinimized(false) }}
        className={cn(
          // Offset above page edge so it never overlaps content/footer; shift left slightly on small screens.
          'fixed bottom-10 right-4 sm:right-6 z-[70] w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
          'bg-slate-800 dark:bg-slate-700 text-white hover:shadow-md transition-shadow',
          isOpen && 'hidden'
        )}
        aria-label="Open page AI assistant"
      >
        <Bot className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-24 right-4 sm:right-6 z-[70] w-96 max-w-[calc(100vw-2rem)]',
              'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col',
              isMinimized ? 'h-14' : 'h-[24rem]'
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">PayAid AI</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{businessName} · {moduleLabel} {pageLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setIsMinimized(!isMinimized)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={isMinimized ? 'Expand' : 'Minimize'}>
                  <Minus className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[11px] text-slate-500 dark:text-slate-400">
                        Specialist
                        <select
                          value={specialistId}
                          onChange={(e) => setSpecialistId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                        >
                          {specialists.length === 0 ? (
                            <option value="">Loading...</option>
                          ) : (
                            specialists.map((specialist) => (
                              <option key={specialist.id} value={specialist.id}>
                                {specialist.name}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400">
                        Mode
                        <select
                          value={actionLevel}
                          onChange={(e) => setActionLevel(e.target.value as ActionLevel)}
                          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                        >
                          <option value="read">Suggest only</option>
                          <option value="draft">Draft for approval</option>
                          <option value="guarded_write">Guarded write</option>
                          <option value="restricted">Restricted action</option>
                        </select>
                      </label>
                    </div>
                    {selectedSpecialist?.promise && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{selectedSpecialist.promise}</p>
                    )}
                    {requiresApproval ? (
                      <p className="text-[11px] rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-2 py-1">
                        {actionLevel === 'restricted'
                          ? 'Restricted mode requires explicit approval on every send.'
                          : 'Guarded write mode requires explicit approval on every send.'}
                      </p>
                    ) : null}
                    {selectedSpecialist?.promptChips?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSpecialist.promptChips.slice(0, 3).map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setInput(chip)}
                            className="rounded-full border border-slate-200 dark:border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {messages.map((message) => (
                    <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-xl px-4 py-2 text-sm',
                          message.role === 'user'
                            ? 'bg-slate-800 dark:bg-slate-700 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-[10px] mt-1 opacity-70">{message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-xl px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Ask about this page..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        'p-2.5 rounded-xl transition-colors',
                        input.trim() && !isLoading ? 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      )}
                      aria-label="Send"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
