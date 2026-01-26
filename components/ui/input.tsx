import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles - Design System compliant
          'flex w-full rounded-lg border border-gray-300',
          'bg-white text-sm text-gray-900',
          'px-3 py-2.5', // 12px horizontal, 14px vertical (44px min touch target)
          'placeholder:text-gray-400',
          'transition-colors duration-150',
          'hover:border-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-teal-primary focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
