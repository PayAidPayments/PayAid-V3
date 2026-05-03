'use client'

import * as React from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Wait for animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const variants = {
    default: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      icon: null,
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  }

  const variantConfig = variants[variant]
  const Icon = variantConfig.icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border',
            variantConfig.bg,
            variantConfig.border,
            'min-w-[300px] max-w-[500px]'
          )}
        >
          {Icon && (
            <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', variantConfig.iconColor)} />
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export interface ToastContainerProps {
  toasts: ToastProps[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  )
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const showToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = {
    success: (title: string, description?: string) => showToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => showToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) => showToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) => showToast({ title, description, variant: 'info' }),
    default: (title: string, description?: string) => showToast({ title, description, variant: 'default' }),
  }

  return {
    toast,
    toasts,
    removeToast,
    ToastContainer: <ToastContainer toasts={toasts} onRemove={removeToast} />,
  }
}
