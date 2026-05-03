import { cn } from '@/lib/utils/cn'

interface CopyFeedbackProps {
  message: string
  visible: boolean
  className?: string
}

export function CopyFeedback({ message, visible, className }: CopyFeedbackProps) {
  if (!visible) return null

  return (
    <div
      className={cn(
        'rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 text-[11px] text-emerald-700 dark:text-emerald-300',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

