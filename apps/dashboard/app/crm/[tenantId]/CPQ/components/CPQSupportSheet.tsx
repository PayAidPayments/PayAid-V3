'use client'

import { useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Quote } from './types'
import { VersionHistoryPanel } from './VersionHistoryPanel'

export type CPQSupportSheetMode = 'history' | 'preview'

type CPQSupportSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: CPQSupportSheetMode
  quotes: Quote[]
}

export function CPQSupportSheet({ open, onOpenChange, mode, quotes }: CPQSupportSheetProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || mode !== 'preview') return
    const id = requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(id)
  }, [open, mode])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col"
        data-testid="cpq-support-sheet"
      >
        <SheetHeader>
          <SheetTitle>{mode === 'preview' ? 'Document preview' : 'Quote history'}</SheetTitle>
          <SheetDescription>
            {mode === 'preview'
              ? 'Customer-facing layout, template, and delivery options. Full PDF and web quote are triggered when you send.'
              : 'Recent versions and status. Supporting detail stays out of the main quote path.'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {mode === 'history' ? <VersionHistoryPanel quotes={quotes} /> : null}
          <div
            ref={previewRef}
            data-testid="cpq-document-preview"
            className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-600 dark:text-slate-300 space-y-3"
          >
            <p className="font-medium text-slate-900 dark:text-slate-100">Customer quote preview</p>
            <p>
              Template: Standard Enterprise Quote v2 · Language: English (India) · Version tracked with
              this workspace.
            </p>
            <p className="text-xs text-slate-500">
              When you are ready, use PDF or Web quote in the inspector, or Send quote from the header
              after validity checks pass.
            </p>
          </div>
          {mode === 'history' ? (
            <p className="text-xs text-slate-500">
              Open Preview from the header for document layout without leaving the quote flow.
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
