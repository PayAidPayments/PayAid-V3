'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import SwaggerUI to avoid SSR issues
// @ts-ignore - swagger-ui-react doesn't have type definitions
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function APIDocsPage() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docs/openapi.json')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load API spec:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading API documentation...</div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load API documentation</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Interactive API documentation with Swagger UI
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        {/* @ts-ignore - swagger-ui-react doesn't have proper type definitions */}
        <SwaggerUI spec={spec} />
      </div>
    </div>
  )
}

