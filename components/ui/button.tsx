import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const buttonClasses = cn(
      // Base styles - Design System compliant
      'inline-flex items-center justify-center rounded-lg text-sm font-semibold',
      'transition-all duration-150 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95', // Micro-interaction
      {
        // Primary Button (High emphasis, main actions) - PayAid Purple #53328A
        'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700': variant === 'default',
        
        // Danger Button (Destructive actions) - Error Red #DC2626
        'bg-error text-white hover:bg-error-dark active:bg-[#991B1B]': variant === 'destructive',
        
        // Secondary Button (Lower emphasis) - Gray 100 background
        'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300': variant === 'secondary',
        
        // Outline Button
        'border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100': variant === 'outline',
        
        // Tertiary/Ghost Button (Minimal style, text-only) - PayAid Purple
        'text-purple-500 hover:bg-purple-50 active:bg-purple-100': variant === 'ghost',
        
        // Link Button - PayAid Purple
        'text-purple-500 underline-offset-4 hover:underline p-0': variant === 'link',
        
        // Size variants (8px grid system)
        'px-4 py-2.5': size === 'default', // 44px height (touch target)
        'px-3 py-1.5 text-xs': size === 'sm', // 32px height
        'px-6 py-3 text-base': size === 'lg', // 48px height
        'h-10 w-10 p-0': size === 'icon', // 40px square
      },
      className
    )

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement<any>, {
        className: cn(buttonClasses, (props.children as React.ReactElement<any>).props.className),
        ref,
        ...props,
      })
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
