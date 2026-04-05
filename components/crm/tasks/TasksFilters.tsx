'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TasksFiltersState {
  status: string
  module: string
  priority: string
  dueDateFrom: string
  dueDateTo: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const MODULE_OPTIONS = [
  { value: '', label: 'All modules' },
  { value: 'crm', label: 'CRM' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

interface TasksFiltersProps {
  filters: TasksFiltersState
  onFiltersChange: (f: TasksFiltersState) => void
  onClear?: () => void
  className?: string
}

export function TasksFilters({
  filters,
  onFiltersChange,
  onClear,
  className,
}: TasksFiltersProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasActive =
    filters.status ||
    filters.module ||
    filters.priority ||
    filters.dueDateFrom ||
    filters.dueDateTo

  return (
    <div className={cn('relative', className)} ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="gap-2"
      >
        Filters
        {hasActive && (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
            on
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border bg-background p-4 shadow-lg">
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="text-xs font-medium text-muted-foreground">Module</label>
            <select
              value={filters.module}
              onChange={(e) => onFiltersChange({ ...filters, module: e.target.value })}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {MODULE_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Due from</label>
                <Input
                  type="date"
                  value={filters.dueDateFrom}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, dueDateFrom: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Due to</label>
                <Input
                  type="date"
                  value={filters.dueDateTo}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, dueDateTo: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            {onClear && hasActive && (
              <Button variant="ghost" size="sm" className="w-full" onClick={onClear}>
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
