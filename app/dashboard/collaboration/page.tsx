'use client'

import { CollaborativeCofounder } from '@/components/CollaborativeCofounder'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'

export default function CollaborationPage() {
  const { tenantId } = useAuthStore()

  if (!tenantId) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col h-full">
      <ModuleTopBar title="Collaborative AI Co-Founder" module="ai-studio" />
      <main className="flex-1 overflow-y-auto p-6">
        <CollaborativeCofounder />
      </main>
    </div>
  )
}
