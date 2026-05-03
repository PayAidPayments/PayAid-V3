'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const Providers = dynamic(
  () => import('./providers').then((m) => ({ default: m.Providers })),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    ),
  }
)

function isChunkLoadError(error: Error): boolean {
  const msg = error?.message ?? ''
  return (
    error?.name === 'ChunkLoadError' ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  )
}

function ChunkErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center max-w-md px-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Loading failed
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          The app could not load in time. This can happen on a slow connection or when the server is busy.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { chunkError: Error | null }
> {
  state = { chunkError: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return isChunkLoadError(error) ? { chunkError: error } : { chunkError: null }
  }

  componentDidCatch(error: Error) {
    if (!isChunkLoadError(error)) throw error
  }

  render() {
    if (this.state.chunkError) {
      return <ChunkErrorFallback onRetry={() => window.location.reload()} />
    }
    return this.props.children
  }
}

export function ProvidersLoader({ children }: { children: React.ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Providers>{children}</Providers>
    </ChunkErrorBoundary>
  )
}
