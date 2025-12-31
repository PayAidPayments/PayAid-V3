'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  const isDatabaseError = error.message?.includes('DATABASE_URL') || 
                          error.message?.toLowerCase().includes('database')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Something went wrong!
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          
          {isDatabaseError && (
            <div className="text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                🔧 Troubleshooting Steps:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 list-disc list-inside space-y-1">
                <li>Check if DATABASE_URL is set in Vercel environment variables</li>
                <li>Verify the database connection string is correct</li>
                <li>If using Supabase, check if your project is paused</li>
                <li>Ensure environment variables are set for Production environment</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium px-6 py-2"
          >
            Go home
          </Button>
        </div>
        
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
