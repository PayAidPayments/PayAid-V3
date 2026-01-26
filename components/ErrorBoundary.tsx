'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Send to error tracking service
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry integration would go here
    }

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred. We've been notified and are working on a fix.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm font-mono text-red-800">
                    <div className="font-semibold mb-2">{this.state.error.name}</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <pre className="text-xs overflow-auto max-h-64">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => (window.location.href = '/')} variant="default">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Module-specific error boundary
 */
export function ModuleErrorBoundary({
  module,
  children,
}: {
  module: string
  children: ReactNode
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`[${module}] Error:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
