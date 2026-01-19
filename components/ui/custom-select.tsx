'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CustomSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
  id?: string
}

interface CustomSelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  items: Map<string, React.ReactNode>
  setItems: (items: Map<string, React.ReactNode>) => void
}

const CustomSelectContext = React.createContext<CustomSelectContextValue>({
  open: false,
  setOpen: () => {},
  items: new Map(),
  setItems: () => {},
})

const CustomSelect = ({ value, onValueChange, placeholder = 'Select...', children, className, id }: CustomSelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Map<string, React.ReactNode>>(new Map())
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <CustomSelectContext.Provider value={{ value, onValueChange, open, setOpen, items, setItems }}>
      <div className={cn('relative w-full', className)}>
        {React.Children.map(children, (child: any) => {
          if (child?.type?.displayName === 'CustomSelectTrigger') {
            return React.cloneElement(child, { ref: triggerRef, id, placeholder })
          }
          if (child?.type?.displayName === 'CustomSelectContent') {
            return React.cloneElement(child, { ref: contentRef })
          }
          return child
        })}
      </div>
    </CustomSelectContext.Provider>
  )
}
CustomSelect.displayName = 'CustomSelect'

interface CustomSelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string
}

const CustomSelectTrigger = React.forwardRef<HTMLButtonElement, CustomSelectTriggerProps>(
  ({ className, placeholder, ...props }, ref) => {
    const context = React.useContext(CustomSelectContext)
    const displayValue = context.value && context.items.has(context.value)
      ? context.items.get(context.value)
      : placeholder

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.setOpen(!context.open)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-purple-50 px-3 py-2 text-base text-gray-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{ backgroundColor: 'rgba(83, 50, 138, 0.08)' }}
        {...props}
      >
        <span className="truncate text-left">{displayValue}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform',
            context.open && 'rotate-180'
          )}
        />
      </button>
    )
  }
)
CustomSelectTrigger.displayName = 'CustomSelectTrigger'

interface CustomSelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CustomSelectContent = React.forwardRef<HTMLDivElement, CustomSelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(CustomSelectContext)

    // Extract items from children and store them
    React.useEffect(() => {
      const itemsMap = new Map<string, React.ReactNode>()
      React.Children.forEach(children, (child: any) => {
        if (React.isValidElement(child) && child.type?.displayName === 'CustomSelectItem') {
          itemsMap.set(child.props.value, child.props.children)
        }
      })
      context.setItems(itemsMap)
    }, [children, context])

    if (!context.open) return null

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 mt-1 w-full max-h-[300px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg',
          className
        )}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
        }}
        {...props}
      >
        <div className="p-1">
          {React.Children.map(children, (child: any) => {
            if (React.isValidElement(child) && child.type?.displayName === 'CustomSelectItem') {
              return child
            }
            return null
          })}
        </div>
      </div>
    )
  }
)
CustomSelectContent.displayName = 'CustomSelectContent'

interface CustomSelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const CustomSelectItem = React.forwardRef<HTMLDivElement, CustomSelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(CustomSelectContext)

    return (
      <div
        ref={ref}
        onClick={() => {
          context.onValueChange?.(value)
          context.setOpen(false)
        }}
        className={cn(
          'relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-colors hover:bg-purple-50 focus:bg-purple-50',
          context.value === value && 'bg-purple-100',
          className
        )}
        style={{
          backgroundColor: context.value === value ? 'rgba(83, 50, 138, 0.15)' : 'transparent',
        }}
        {...props}
      >
        <span className="flex items-center gap-2">{children}</span>
      </div>
    )
  }
)
CustomSelectItem.displayName = 'CustomSelectItem'

export { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem }
