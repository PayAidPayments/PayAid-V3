'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Short URL for Marketing demo. Redirects to /demo/marketing.
 * Share: https://yourapp.com/marketing-demo
 */
export default function MarketingDemoRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/demo/marketing')
  }, [router])
  return null
}
