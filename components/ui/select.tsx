'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronDown } from 'lucide-react'

// Context for Select component
interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue>({})

// Main Select component (wrapper)
interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  )
}
Select.displayName = 'Select'

// SelectTrigger - the actual select element
interface SelectTriggerProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
  children?: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLSelectElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    
    // Extract SelectValue placeholder and filter out SelectValue from children
    let placeholder = 'Choose an option...'
    const validChildren: React.ReactElement[] = []
    
    React.Children.forEach(children, (child: any) => {
      if (React.isValidElement(child)) {
        if (child.type && (child.type as any).displayName === 'SelectValue') {
          placeholder = (child.props as any)?.placeholder || placeholder
        } else if (
          (child.type && (child.type as any).displayName === 'SelectItem') ||
          child.type === 'option'
        ) {
          validChildren.push(child)
        }
      }
    })
    
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-purple-50 dark:bg-gray-800 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-gray-100 ring-offset-background focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          style={{ backgroundColor: 'rgba(83, 50, 138, 0.08)' }}
          value={context.value || props.value || ''}
          onChange={(e) => {
            context.onValueChange?.(e.target.value)
            props.onChange?.(e)
          }}
          {...props}
        >
          {!context.value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {validChildren}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-gray-400" />
      </div>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

// SelectValue - displays the selected value (for display purposes, actual value comes from select)
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  // This is just a marker component, actual rendering happens in SelectTrigger
  return null
}
SelectValue.displayName = 'SelectValue'

// SelectContent - wrapper for options (no-op in native select)
const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <>{children}</>
}
SelectContent.displayName = 'SelectContent'

// SelectItem - option element
interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
  children: React.ReactNode
}

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    return (
      <option 
        ref={ref} 
        value={value} 
        className={cn('text-gray-900 dark:text-gray-100 bg-purple-50 dark:bg-gray-800', className)} 
        style={{ backgroundColor: 'rgba(83, 50, 138, 0.08)' }}
        {...props}
      >
        {children}
      </option>
    )
  }
)
SelectItem.displayName = 'SelectItem'

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

