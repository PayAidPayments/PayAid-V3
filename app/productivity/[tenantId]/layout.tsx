'use client'

import { useParams } from 'next/navigation'
import { UniversalModuleLayout } from '@/components/modules/UniversalModuleLayout'

const PRODUCTIVITY_TABS = [
  { name: 'PayAid Sheets', href: '', slug: 'sheets' },
  { name: 'PayAid Docs', href: '', slug: 'docs' },
  { name: 'PayAid Slides', href: '', slug: 'slides' },
  { name: 'PayAid Drive', href: '', slug: 'drive' },
  { name: 'PayAid Meet', href: '', slug: 'meet' },
  { name: 'PayAid PDF', href: '', slug: 'pdf' },
  { name: 'Document Builder', href: '', slug: 'builder' },
] as const

export default function ProductivityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = PRODUCTIVITY_TABS.map((tab) => ({
    name: tab.name,
    href: `/productivity/${tenantId}/${tab.slug}`,
  }))

  return (
    <UniversalModuleLayout
      moduleId="productivity"
      moduleName="Productivity"
      topBarItems={topBarItems}
    >
      {children}
    </UniversalModuleLayout>
  )
}
