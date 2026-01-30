'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { AlertCircle, CheckCircle } from 'lucide-react'

export interface FormFieldProps {
  label?: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * FormField Component
 * Provides consistent form field styling with validation messages
 * Uses PayAid design system colors and animations
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, success, hint, required, children, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && (
              <span className="text-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper with error/success states */}
        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            className: cn(
              (children as React.ReactElement).props.className,
              error && 'border-error focus:ring-error',
              success && 'border-success focus:ring-success'
            ),
          })}

          {/* Success icon */}
          {success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
          )}

          {/* Error icon */}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
          )}
        </div>

        {/* Validation messages with animations */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-start gap-2 text-sm text-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && !error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-start gap-2 text-sm text-success"
            >
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          {hint && !error && !success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              {hint}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
FormField.displayName = 'FormField'
