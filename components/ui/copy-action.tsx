'use client'

import { ReactNode } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { CopyFeedback } from '@/components/ui/copy-feedback'
import { useCopyToClipboardFeedback } from '@/lib/hooks/useCopyToClipboardFeedback'
import { cn } from '@/lib/utils/cn'

type TextFactory = string | (() => string | Promise<string>)

export const COPY_ACTION_BUTTON_WIDTH_CLASS = {
  none: '',
  default: 'min-w-[100px] justify-center',
  wide: 'min-w-[112px] justify-center',
} as const

export const COPY_ACTION_FEEDBACK_WIDTH_CLASS = {
  none: '',
  compact: 'max-w-[220px]',
} as const

interface CopyActionProps {
  textToCopy: TextFactory
  successMessage: string
  label: string
  copiedLabel?: string
  icon?: ReactNode
  buttonProps?: Omit<ButtonProps, 'onClick' | 'children'>
  showFeedback?: boolean
  feedbackClassName?: string
  containerClassName?: string
  copiedDurationMs?: number
  feedbackDurationMs?: number
  widthPreset?: keyof typeof COPY_ACTION_BUTTON_WIDTH_CLASS
}

export type CopyActionPreset = Pick<
  CopyActionProps,
  'widthPreset' | 'feedbackClassName' | 'containerClassName' | 'copiedDurationMs' | 'feedbackDurationMs'
>

export const COPY_ACTION_PRESETS: Record<string, CopyActionPreset> = {
  compactSettings: {
    widthPreset: 'default',
    containerClassName: 'shrink-0',
    feedbackClassName: COPY_ACTION_FEEDBACK_WIDTH_CLASS.compact,
  },
  wideExport: {
    widthPreset: 'wide',
    containerClassName: 'inline-flex',
  },
  compactSettingsLongCopy: {
    widthPreset: 'default',
    containerClassName: 'shrink-0',
    feedbackClassName: COPY_ACTION_FEEDBACK_WIDTH_CLASS.compact,
    copiedDurationMs: 2000,
    feedbackDurationMs: 2200,
  },
}

export function CopyAction({
  textToCopy,
  successMessage,
  label,
  copiedLabel = 'Copied',
  icon,
  buttonProps,
  showFeedback = true,
  feedbackClassName,
  containerClassName,
  copiedDurationMs,
  feedbackDurationMs,
  widthPreset = 'none',
}: CopyActionProps) {
  const copy = useCopyToClipboardFeedback({ copiedDurationMs, feedbackDurationMs })
  const { className: buttonClassName, ...restButtonProps } = buttonProps ?? {}

  const resolveText = async (): Promise<string> => {
    if (typeof textToCopy === 'function') {
      const value = await textToCopy()
      return String(value || '')
    }
    return String(textToCopy || '')
  }

  return (
    <div className={cn('inline-flex flex-col', containerClassName)}>
      <Button
        type="button"
        {...restButtonProps}
        className={cn(COPY_ACTION_BUTTON_WIDTH_CLASS[widthPreset], buttonClassName)}
        onClick={async () => {
          const value = await resolveText()
          if (!value) return
          await copy.copyText(value, successMessage)
        }}
      >
        {icon}
        {copy.isCopied ? copiedLabel : label}
      </Button>
      {showFeedback ? (
        <CopyFeedback
          visible={Boolean(copy.feedbackMessage)}
          message={copy.feedbackMessage}
          className={cn('mt-2', feedbackClassName)}
        />
      ) : null}
    </div>
  )
}

