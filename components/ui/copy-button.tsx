'use client'

import { Button } from './button'
import { useCopyToClipboardFeedback } from '@/lib/hooks/useCopyToClipboardFeedback'

interface CopyButtonProps {
  text: string
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showText?: boolean
}

export function CopyButton({ text, className, variant = 'ghost', size = 'icon', showText = false }: CopyButtonProps) {
  const copy = useCopyToClipboardFeedback({ copiedDurationMs: 2000, feedbackDurationMs: 2000 })

  const handleCopy = async () => {
    const copied = await copy.copyText(text, 'Copied to clipboard.')
    if (!copied) {
      console.error('Failed to copy text from CopyButton.')
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={className}
      title={copy.isCopied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copy.isCopied ? (
        <>
          {showText && <span className="mr-2">Copied!</span>}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </>
      ) : (
        <>
          {showText && <span className="mr-2">Copy</span>}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </>
      )}
    </Button>
  )
}
