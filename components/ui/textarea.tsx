import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, ...props }, ref) => {
    return (
      <motion.textarea
        className={cn(
          // Base styles - Design System compliant
          'flex min-h-[80px] w-full rounded-lg border',
          'bg-white px-3 py-2 text-sm text-gray-900',
          'ring-offset-background placeholder:text-gray-400',
          'transition-all duration-150',
          'hover:border-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
          // Error state - PayAid design system colors
          error && 'border-error focus-visible:ring-error',
          // Success state - PayAid design system colors
          success && 'border-success focus-visible:ring-success',
          // Default state
          !error && !success && 'border-gray-300 focus-visible:ring-purple-500',
          className
        )}
        ref={ref}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }

