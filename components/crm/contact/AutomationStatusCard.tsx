'use client'

import React from 'react'
import { Workflow, Clock3, Activity } from 'lucide-react'

interface AutomationStatusCardProps {
  contact: any
}

export const AutomationStatusCard: React.FC<AutomationStatusCardProps> = ({ contact }) => {
  const recentActivity = contact?.contact360?.activityFeed?.[0]
  const enrollments = contact?.contact360?.nurtureEnrollments?.length ?? 0
  const timelineCount = contact?.contact360?.activityFeed?.length ?? 0

  return (
    <section
      data-testid="automation-status-card"
      className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 space-y-3"
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
          <Workflow className="w-4 h-4 text-violet-500" />
          Automation Status
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
          Workflow and activity automation snapshot
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-2.5">
          <div className="text-xs text-slate-500 dark:text-gray-400">Nurture enrollments</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{enrollments}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-2.5">
          <div className="text-xs text-slate-500 dark:text-gray-400">Automation events</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{timelineCount}</div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3 text-xs text-slate-600 dark:text-gray-300">
        {recentActivity ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium">Last automation event</span>
            </div>
            <p className="capitalize">{recentActivity.kind?.replace('_', ' ') || 'Activity'}</p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
            <span>No recent automation events recorded.</span>
          </div>
        )}
      </div>
    </section>
  )
}
