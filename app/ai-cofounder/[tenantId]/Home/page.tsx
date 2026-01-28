'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function AICofounderHomePage() {
  const router = useRouter()
  const params = useParams()
  const { tenant } = useAuthStore()
  
  // Get tenantId from URL params first, fallback to auth store
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? (tenantIdParam[0] || null)
    : (tenantIdParam as string | undefined || null)
  const tenantId: string | undefined = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : (tenant?.id && typeof tenant.id === 'string' && tenant.id.trim() ? tenant.id : undefined)

  useEffect(() => {
    if (!tenantId) {
      // If no tenantId, redirect to entry point
      router.push('/ai-cofounder')
      return
    }
    
    // Redirect to the actual Cofounder page in ai-studio
    router.replace(`/ai-studio/${tenantId}/Cofounder`)
  }, [tenantId, router])

  return <PageLoading message="Loading AI Co-founder..." fullScreen={true} />
}
