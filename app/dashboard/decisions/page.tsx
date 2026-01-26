'use client'

import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
import { AIDecisionDashboard } from '@/components/AIDecisionDashboard'
import { ApprovalQueue } from '@/components/ApprovalQueue'
import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DecisionsDashboardPage() {
  const { tenantId } = useAuthStore()

  if (!tenantId) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col h-full">
      <ModuleTopBar title="AI Decision Automation" module="ai-studio" />
      <main className="flex-1 overflow-y-auto">
        <Tabs defaultValue="decisions" className="p-6">
          <TabsList>
            <TabsTrigger value="decisions">All Decisions</TabsTrigger>
            <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          </TabsList>
          <TabsContent value="decisions" className="mt-6">
            <AIDecisionDashboard />
          </TabsContent>
          <TabsContent value="approvals" className="mt-6">
            <ApprovalQueue />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
