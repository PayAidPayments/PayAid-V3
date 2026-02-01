'use client'

import { motion } from 'framer-motion'
import { Building2, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import Link from 'next/link'

interface MetricCard {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  color?: 'purple' | 'gold' | 'success' | 'info' | 'warning' | 'error'
  href?: string // Optional navigation URL
  onClick?: () => void // Optional click handler
}

interface UniversalModuleHeroProps {
  moduleName: string
  moduleIcon?: React.ReactNode
  gradientFrom: string // Tailwind color class (e.g., 'from-purple-500')
  gradientTo: string // Tailwind color class (e.g., 'to-purple-700')
  metrics: MetricCard[]
  subtitle?: string
}

export function UniversalModuleHero({
  moduleName,
  moduleIcon,
  gradientFrom,
  gradientTo,
  metrics,
  subtitle,
}: UniversalModuleHeroProps) {
  const { tenant, user } = useAuthStore()

  const getMetricColor = (color?: MetricCard['color']) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-500',
          text: 'text-purple-900 dark:text-purple-100',
          textSecondary: 'text-purple-700 dark:text-purple-300',
        }
      case 'gold':
        return {
          bg: 'bg-gold-50 dark:bg-gold-900/20',
          border: 'border-gold-500',
          text: 'text-gold-900 dark:text-gold-100',
          textSecondary: 'text-gold-700 dark:text-gold-300',
        }
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-500',
          text: 'text-emerald-900 dark:text-emerald-100',
          textSecondary: 'text-emerald-700 dark:text-emerald-300',
        }
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-500',
          text: 'text-blue-900 dark:text-blue-100',
          textSecondary: 'text-blue-700 dark:text-blue-300',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-500',
          text: 'text-yellow-900 dark:text-yellow-100',
          textSecondary: 'text-yellow-700 dark:text-yellow-300',
        }
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-500',
          text: 'text-red-900 dark:text-red-100',
          textSecondary: 'text-red-700 dark:text-red-300',
        }
      default:
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-500',
          text: 'text-purple-900 dark:text-purple-100',
          textSecondary: 'text-purple-700 dark:text-purple-300',
        }
    }
  }

  return (
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white px-6 py-8 shadow-xl`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            {moduleIcon && <span className="text-white">{moduleIcon}</span>}
            <span>{moduleName} Dashboard</span>
          </h1>
          {subtitle ? (
            <p className="text-lg text-white/90">{subtitle}</p>
          ) : (
            <p className="text-lg text-white/90 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {tenant?.name || 'Your Business'}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-white/80">Welcome back,</p>
          <p className="text-lg font-semibold">{user?.name || 'User'}</p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const colors = getMetricColor(metric.color)
          const isClickable = metric.href || metric.onClick

          const CardContent = (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold ${colors.textSecondary} uppercase tracking-wider`}>
                  {metric.label}
                </p>
                {metric.icon && <div className={colors.textSecondary}>{metric.icon}</div>}
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${colors.text}`}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString('en-IN') : metric.value}
                </p>
                {metric.change !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    metric.trend === 'up' ? 'text-emerald-700 dark:text-emerald-300' : 
                    metric.trend === 'down' ? 'text-red-700 dark:text-red-300' : 
                    colors.textSecondary
                  }`}>
                    <TrendingUp className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                )}
              </div>
            </>
          )

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              {metric.href ? (
                <Link
                  href={metric.href}
                  className={`
                    block ${colors.bg} ${colors.border} border-2 rounded-lg p-4
                    ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
                    transition-all duration-200
                  `}
                >
                  {CardContent}
                </Link>
              ) : (
                <div
                  onClick={metric.onClick}
                  className={`
                    ${colors.bg} ${colors.border} border-2 rounded-lg p-4
                    ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
                    transition-all duration-200
                  `}
                >
                  {CardContent}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
