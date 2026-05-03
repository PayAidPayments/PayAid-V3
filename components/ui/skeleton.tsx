'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'default',
  animate = true,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    default: 'rounded',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  }

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...(props as any)}
      />
    )
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <Skeleton variant="rectangular" className="h-8 w-1/3" />
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" className="h-10 w-24" />
        <Skeleton variant="rectangular" className="h-10 w-24" />
      </div>
    </div>
  )
}
