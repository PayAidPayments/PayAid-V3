'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch on component mount if data is fresh
            retry: 1, // Only retry once on failure
            retryDelay: 1000, // Wait 1 second before retry
            networkMode: 'online', // Only retry when online
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

