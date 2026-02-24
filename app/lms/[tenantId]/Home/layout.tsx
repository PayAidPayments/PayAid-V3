'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function LMSHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/lms/${tenantId}/Home` },
    { name: 'Courses', href: `/lms/${tenantId}/Courses` },
    { name: 'Students', href: `/lms/${tenantId}/Students` },
  ]

  return (
    <AppShell moduleId="lms" moduleName="LMS" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
