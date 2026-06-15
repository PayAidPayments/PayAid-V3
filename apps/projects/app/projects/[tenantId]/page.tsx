'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { buildCanonicalModuleUrl } from '@/lib/utils/canonical-module-url'

export default function ProjectsTenantIndexPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const didRedirect = useRef(false)

  useEffect(() => {
    if (!tenantId || didRedirect.current) return
    didRedirect.current = true
    window.location.replace(buildCanonicalModuleUrl('projects', `/projects/${tenantId}/Home`))
  }, [tenantId])

  return null
}
