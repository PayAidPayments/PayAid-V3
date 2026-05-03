'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCopyToClipboardFeedbackOptions {
  copiedDurationMs?: number
  feedbackDurationMs?: number
}

export function useCopyToClipboardFeedback(options: UseCopyToClipboardFeedbackOptions = {}) {
  const copiedDurationMs = options.copiedDurationMs ?? 1500
  const feedbackDurationMs = options.feedbackDurationMs ?? 1800

  const [isCopied, setIsCopied] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const copiedTimeoutRef = useRef<number | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = null
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
  }, [])

  const copyText = useCallback(
    async (text: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(text)
        clearTimers()
        setIsCopied(true)
        setFeedbackMessage(successMessage)
        copiedTimeoutRef.current = window.setTimeout(() => setIsCopied(false), copiedDurationMs)
        feedbackTimeoutRef.current = window.setTimeout(() => setFeedbackMessage(''), feedbackDurationMs)
        return true
      } catch {
        clearTimers()
        setIsCopied(false)
        setFeedbackMessage('')
        return false
      }
    },
    [clearTimers, copiedDurationMs, feedbackDurationMs]
  )

  useEffect(() => clearTimers, [clearTimers])

  return {
    isCopied,
    feedbackMessage,
    copyText,
  }
}

