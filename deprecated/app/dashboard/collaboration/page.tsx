'use client'

import { CollaborativeCofounder } from '@/components/CollaborativeCofounder'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'

export default function CollaborationPage() {
  const { tenant } = useAuthStore()

  if (!tenant?.id) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col h-full">
      <ModuleTopBar 
        moduleId="ai-studio" 
        moduleName="Collaborative AI Co-Founder" 
        items={[]} 
      />
      <main className="flex-1 overflow-y-auto p-6">
        <CollaborativeCofounder />
      </main>
    </div>
  )
}
