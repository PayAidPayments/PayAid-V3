'use client'

import { useParams } from 'next/navigation'
import { TaskList } from '@/components/productivity/TaskList'

export default function TasksPageNew() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="container mx-auto p-6">
      <TaskList organizationId={tenantId} />
    </div>
  )
}
