'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { AppShell } from '@/components/modules/AppShell'
import { getHRTopBarItems } from '@/lib/hr/hr-top-bar-items'

function buildTenantPath(pathname: string, publicId: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return pathname
  segments[1] = publicId
  return '/' + segments.join('/')
}

export default function HRTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const tenantId = params.tenantId as string
  const topBarItems = getHRTopBarItems(tenantId)
  const redirectChecked = useRef(false)

  // Slug-based URLs: if URL has internal id and tenant has slug, redirect to slug URL (301 behavior via replace)
  useEffect(() => {
    if (!tenantId || !pathname || redirectChecked.current || !token) return
    redirectChecked.current = true
    fetch(`/api/tenant/resolve?param=${encodeURIComponent(tenantId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.shouldRedirectToSlug && data?.publicId) {
          router.replace(buildTenantPath(pathname, data.publicId))
        }
      })
      .catch(() => {})
  }, [tenantId, pathname, token, router])

  return (
    <AppShell moduleId="hr" moduleName="HR" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
