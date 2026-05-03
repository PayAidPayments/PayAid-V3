'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open: controlledOpen, onOpenChange, children }: DialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    const context = React.useContext(DialogContext)
    if (!context) {
      throw new Error('DialogTrigger must be used within Dialog')
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        onClick: (e: React.MouseEvent) => {
          context.onOpenChange(true)
          if (children.props && typeof children.props === 'object' && 'onClick' in children.props && typeof children.props.onClick === 'function') {
            children.props.onClick(e)
          }
        },
      } as any)
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.onOpenChange(true)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = 'DialogTrigger'

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(DialogContext)
    if (!context) {
      throw new Error('DialogContent must be used within Dialog')
    }

    // Always call useEffect (Rules of Hooks) - conditionally apply effects based on open state
    React.useEffect(() => {
      if (!context.open) {
        return
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          context.onOpenChange(false)
        }
      }
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }, [context.open, context.onOpenChange])

    if (!context.open) {
      return null
    }

    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
          onClick={() => context.onOpenChange(false)}
        />
        <div
          ref={ref}
          className={cn(
            // Design System: Modal with proper animations and styling
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg',
            'translate-x-[-50%] translate-y-[-50%]',
            'gap-4 border border-gray-200 bg-white',
            'p-6 shadow-lg',
            'animate-scale-in',
            'sm:rounded-xl', // 12px radius for large containers
            className
          )}
          {...props}
        >
          {children}
          <button
            type="button"
            onClick={() => context.onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity duration-150 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    )
  }
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // Design System: Dialog header with proper spacing
      'flex flex-col space-y-1.5',
      'p-6 border-b border-gray-200',
      'text-center sm:text-left',
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      // Design System: H2 - 24px / 600 weight / 1.4 line-height
      'text-xl font-semibold leading-tight tracking-tight',
      'text-gray-900',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      // Design System: Body Small - 14px / 400 weight
      'text-sm text-gray-600',
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // Design System: Dialog footer with proper spacing
      'flex flex-col-reverse sm:flex-row sm:justify-end',
      'gap-3 p-6 border-t border-gray-200',
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}

