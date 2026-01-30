import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    // Design System: Alert variants with proper colors and icons
    const variantStyles = {
      default: 'bg-white text-gray-900 border-gray-200 [&>svg]:text-gray-900',
      destructive: 'bg-red-error/10 text-red-error border-l-4 border-red-error [&>svg]:text-red-error',
      success: 'bg-emerald-success/10 text-emerald-success border-l-4 border-emerald-success [&>svg]:text-emerald-success',
      warning: 'bg-amber-alert/10 text-amber-alert border-l-4 border-amber-alert [&>svg]:text-amber-alert',
      info: 'bg-blue-secondary/10 text-blue-secondary border-l-4 border-blue-secondary [&>svg]:text-blue-secondary',
    }

    const variantIcons = {
      default: null,
      destructive: <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      success: <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      warning: <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      info: <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />,
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          // Design System: Alert with proper spacing and layout
          'relative w-full rounded-lg border p-4',
          'flex items-start gap-3',
          '[&>svg~*]:pl-0 [&>svg+div]:translate-y-0',
          '[&>svg]:flex-shrink-0',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {variantIcons[variant]}
        <div className="flex-1">{children}</div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      // Design System: Alert title typography
      'mb-1 font-semibold leading-none tracking-tight',
      'text-sm',
      className
    )}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Design System: Alert description typography
      'text-sm [&_p]:leading-relaxed',
      className
    )}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }

