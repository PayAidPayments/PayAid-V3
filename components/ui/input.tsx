import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <motion.input
        type={type}
        {...(props as any)}
        className={cn(
          // Base styles - Design System compliant
          'flex w-full rounded-lg border',
          'bg-white text-sm text-gray-900',
          'px-3 py-2.5', // 12px horizontal, 14px vertical (44px min touch target)
          'placeholder:text-gray-400',
          'transition-all duration-150',
          'hover:border-gray-400',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Error state - PayAid design system colors
          error && 'border-error focus:ring-error',
          // Success state - PayAid design system colors
          success && 'border-success focus:ring-success',
          // Default state
          !error && !success && 'border-gray-300 focus:ring-purple-500',
          className
        )}
        ref={ref}
        suppressHydrationWarning
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
        {...(props as any)}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
