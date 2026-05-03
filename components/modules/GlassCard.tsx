'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

/**
 * Universal GlassCard Component
 * Used across all 28 modules for consistent content sections
 * Features: Glass morphism effect, subtle shadow, rounded corners
 */
export function GlassCard({ children, className, hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-xl p-6',
        'border border-gray-200/50',
        'shadow-md',
        hover && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
