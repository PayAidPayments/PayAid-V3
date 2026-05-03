import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// Elevated Card (Shadow effect, interactive) - Design System compliant
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base card styles - Design System compliant
      'bg-white rounded-lg shadow-sm', // Elevation 1: 0px 1px 2px rgba(0,0,0,0.05)
      'border border-gray-200',
      'text-gray-900',
      'transition-shadow duration-200', // Smooth shadow transitions
      'hover:shadow-md', // Elevation 2 on hover: 0px 4px 6px rgba(0,0,0,0.10)
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)} // 24px padding (8px grid)
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // Typography: H3 - 20px / 600 weight / 1.5 line-height
      'text-lg font-semibold leading-tight tracking-tight',
      'text-gray-900', // Primary headings color
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      // Typography: Body Small - 14px / 400 weight / 1.5 line-height
      'text-sm text-gray-600', // Secondary text color
      className
    )}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('p-6 pt-0', className)} // 24px padding (8px grid)
    {...props} 
  />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)} // 24px padding (8px grid)
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
