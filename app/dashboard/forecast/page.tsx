'use client'

import { RevenueForecasting } from '@/components/RevenueForecasting'

export default function ForecastPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Revenue Forecasting</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered 90-day revenue forecast with confidence intervals
          </p>
        </div>
        <RevenueForecasting />
      </div>
    </div>
  )
}
