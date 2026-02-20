'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export interface PopoverTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

export interface PopoverContentProps {
  className?: string
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export function Popover({ open: controlledOpen, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(value)
      }
      onOpenChange?.(value)
    },
    [controlledOpen, onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, children, className, ...props }, ref) => {
    const { setOpen, open } = React.useContext(PopoverContext)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: () => setOpen(!open),
        ref,
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = 'PopoverTrigger'

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, align = 'center', side = 'bottom', ...props }, ref) => {
    const { open } = React.useContext(PopoverContext)

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 w-72 rounded-md border bg-white dark:bg-gray-800 p-4 shadow-md',
          side === 'bottom' && 'top-full mt-1',
          side === 'top' && 'bottom-full mb-1',
          side === 'right' && 'left-full ml-1',
          side === 'left' && 'right-full mr-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = 'PopoverContent'
