'use client'

import { motion } from 'framer-motion'
import { Building2, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

interface MetricCard {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  color?: 'purple' | 'gold' | 'success' | 'info' | 'warning' | 'error'
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
        return 'border-purple-500 bg-purple-50'
      case 'gold':
        return 'border-gold-500 bg-gold-50'
      case 'success':
        return 'border-success bg-success-light'
      case 'info':
        return 'border-info bg-info-light'
      case 'warning':
        return 'border-warning bg-warning-light'
      case 'error':
        return 'border-error bg-error-light'
      default:
        return 'border-purple-500 bg-purple-50'
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
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`
              bg-white/10 backdrop-blur-sm rounded-lg p-4
              border-2 border-white/20
              hover:bg-white/20 transition-all duration-200
              ${getMetricColor(metric.color)}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                {metric.label}
              </p>
              {metric.icon && <div className="text-white/80">{metric.icon}</div>}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {typeof metric.value === 'number' ? metric.value.toLocaleString('en-IN') : metric.value}
              </p>
              {metric.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  metric.trend === 'up' ? 'text-success' : 
                  metric.trend === 'down' ? 'text-error' : 
                  'text-white/70'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
