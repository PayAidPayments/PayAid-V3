'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

/**
 * Global floating action button for "Ask AI" — visible on module pages when authenticated.
 * Opens a slide-over with quick link to AI Studio Chat (contextualized to current module).
 */
export function AIAssistantFAB() {
  const pathname = usePathname()
  const { tenant, isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const tenantId = tenant?.id
  const segment = pathname?.split('/').filter(Boolean)
  const maybeModule = segment[0]
  const isModuleRoute = ['crm', 'sales', 'marketing', 'finance', 'hr', 'projects', 'inventory', 'ai-studio'].includes(maybeModule ?? '')
  const showFAB = mounted && isAuthenticated && tenantId && isModuleRoute && !pathname?.startsWith('/login')

  if (!showFAB) return null

  const chatUrl = `/ai-studio/${tenantId}/Chat`
  const contextModule = segment[0] ?? 'general'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Ask AI"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Ask AI
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Get help with your company data. Open AI Chat with context from your current page.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setOpen(false)
              window.location.href = chatUrl
            }}
          >
            Open AI Chat
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Context: {contextModule}. The chat can answer questions about your data in this module.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
