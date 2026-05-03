'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MerchantsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/super-admin/business/tenants')
  }, [router])

  return null
}
