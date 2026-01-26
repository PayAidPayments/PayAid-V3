'use client'

import { ComplianceDashboard } from '@/components/ComplianceDashboard'

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Compliance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Audit logs, PII detection, and compliance monitoring
          </p>
        </div>
        <ComplianceDashboard />
      </div>
    </div>
  )
}
