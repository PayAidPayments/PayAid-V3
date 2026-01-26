import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - Design System compliant
          'inline-flex items-center justify-center rounded-lg text-sm font-semibold',
          'transition-all duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95', // Micro-interaction
          {
            // Primary Button (High emphasis, main actions) - #0F766E
            'bg-teal-primary text-white hover:bg-[#0D5B54] active:bg-[#0A4A43]': variant === 'default',
            
            // Danger Button (Destructive actions) - #DC2626
            'bg-red-error text-white hover:bg-[#B91C1C] active:bg-[#991B1B]': variant === 'destructive',
            
            // Secondary Button (Lower emphasis) - Gray 100 background
            'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300': variant === 'secondary',
            
            // Outline Button
            'border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100': variant === 'outline',
            
            // Tertiary/Ghost Button (Minimal style, text-only)
            'text-teal-primary hover:bg-teal-primary/10 active:bg-teal-primary/20': variant === 'ghost',
            
            // Link Button
            'text-teal-primary underline-offset-4 hover:underline p-0': variant === 'link',
            
            // Size variants (8px grid system)
            'px-4 py-2.5': size === 'default', // 44px height (touch target)
            'px-3 py-1.5 text-xs': size === 'sm', // 32px height
            'px-6 py-3 text-base': size === 'lg', // 48px height
            'h-10 w-10 p-0': size === 'icon', // 40px square
          },
          className
        )}
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
