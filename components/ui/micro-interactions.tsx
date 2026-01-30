'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * Success Feedback Animation
 * Shows a success checkmark with animation
 */
export function SuccessFeedback({ 
  message, 
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex items-center gap-2 text-sm text-success',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: 'backOut' }}
      >
        <CheckCircle className="w-5 h-5" />
      </motion.div>
      {message && <span>{message}</span>}
    </motion.div>
  )
}

/**
 * Error Feedback Animation
 * Shows an error icon with shake animation
 */
export function ErrorFeedback({ 
  message, 
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2 text-sm text-error',
        className
      )}
    >
      <motion.div
        animate={{ 
          x: [0, -4, 4, -4, 4, 0],
        }}
        transition={{ 
          duration: 0.5,
          ease: 'easeInOut'
        }}
      >
        <XCircle className="w-5 h-5" />
      </motion.div>
      {message && <span>{message}</span>}
    </motion.div>
  )
}

/**
 * Data Update Animation
 * Pulse animation for data updates
 */
export function DataUpdateIndicator({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ 
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Shake Animation
 * Shakes an element to draw attention
 */
export function Shake({ 
  children,
  trigger,
  className 
}: { 
  children: React.ReactNode
  trigger?: boolean
  className?: string 
}) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
      } : {}}
      transition={{ 
        duration: 0.5,
        ease: 'easeInOut'
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Pulse Animation
 * Pulses an element to indicate activity
 */
export function Pulse({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Fade In Animation
 * Fades in content smoothly
 */
export function FadeIn({ 
  children,
  delay = 0,
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        delay,
        ease: 'easeOut'
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide In Animation
 * Slides content in from a direction
 */
export function SlideIn({ 
  children,
  direction = 'up',
  delay = 0,
  className 
}: { 
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  className?: string 
}) {
  const variants = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...variants[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration: 0.4,
        delay,
        ease: 'easeOut'
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Status Badge with Animation
 * Animated badge for status indicators
 */
export function StatusBadge({ 
  status,
  message,
  className 
}: { 
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  className?: string 
}) {
  const config = {
    success: {
      icon: CheckCircle,
      color: 'text-success bg-success/10 border-success',
    },
    error: {
      icon: XCircle,
      color: 'text-error bg-error/10 border-error',
    },
    warning: {
      icon: AlertCircle,
      color: 'text-warning bg-warning/10 border-warning',
    },
    info: {
      icon: Info,
      color: 'text-info bg-info/10 border-info',
    },
  }

  const { icon: Icon, color } = config[status]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium',
        color,
        className
      )}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <span>{message}</span>
    </motion.div>
  )
}
