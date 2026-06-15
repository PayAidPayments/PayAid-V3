'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

/**
 * Production RUM for Vercel deployments. Lazy-loaded in app shells so
 * analytics does not inflate the server component graph.
 */
export function VercelWebVitals() {
  if (process.env.NEXT_PUBLIC_VERCEL_WEB_VITALS === '0') {
    return null
  }
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
