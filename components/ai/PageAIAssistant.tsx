'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Mic, MicOff, Loader2, Minus } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useCurrentPageContext } from '@/lib/hooks/useCurrentPageContext'
import { cn } from '@/lib/utils/cn'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function buildErrorMessage(status: number, data: { message?: string; error?: string; hint?: string }): string {
  const serverMessage = data?.message || data?.error
  const hint = data?.hint
  if (status === 401) return 'Please sign in again to use the AI assistant.'
  if (status === 403) return serverMessage || "You don't have access to the AI assistant."
  if (status === 400) return serverMessage || "Your message couldn't be processed. Please rephrase."
  if (serverMessage || hint) return [serverMessage, hint].filter(Boolean).join('\n\n')
  return "I couldn't get a response right now. Please try again."
}

/**
 * Page-scoped AI assistant for the unified shell. Required on every page.
 * Uses current route to set module + page + tenantId; AI only answers about this company's data on this page.
 */
export function PageAIAssistant() {
  const ctx = useCurrentPageContext()
  const { token } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I'm your PayAid AI for **${ctx.module} → ${ctx.page}**. I can only help with your company's data on this page. Ask me anything about it.`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
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
          context: { module: ctx.module, page: ctx.page, tenantId: ctx.tenantId },
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
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full',
          'bg-slate-800 dark:bg-slate-700 text-white shadow-lg flex items-center justify-center',
          'hover:shadow-md transition-shadow',
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
              'fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]',
              'bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col',
              isMinimized ? 'h-14' : 'h-[520px]'
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Page AI</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{ctx.module} → {ctx.page}</p>
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
