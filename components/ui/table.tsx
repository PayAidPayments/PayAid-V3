import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      // Design System: Table row with proper hover and transitions
      'border-b border-gray-200 dark:border-gray-700',
      'transition-colors duration-150',
      'hover:bg-gray-50 dark:hover:bg-gray-800',
      'data-[state=selected]:bg-teal-primary/10 dark:data-[state=selected]:bg-teal-primary/20',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // Design System: Table header with proper typography
      'h-12 px-6 text-left align-middle',
      'text-xs font-semibold text-gray-700 uppercase tracking-wider',
      'bg-gray-50 dark:bg-gray-800',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      // Design System: Table cell with proper spacing
      'px-6 py-4 align-middle',
      'text-sm text-gray-900 dark:text-gray-100',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell }
