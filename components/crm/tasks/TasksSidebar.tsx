'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle, CheckCircle2, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TasksSidebarProps {
  openCount: number
  overdueCount: number
  completedTodayCount: number
  activeQuickFilter: string | null
  onQuickFilter: (filter: string | null) => void
  recentActivity?: Array< { id: string; title: string; at: string } >
  className?: string
}

export function TasksSidebar({
  openCount,
  overdueCount,
  completedTodayCount,
  activeQuickFilter,
  onQuickFilter,
  recentActivity = [],
  className,
}: TasksSidebarProps) {
  const quickFilters = [
    { key: 'today', label: 'Today', icon: Clock },
    { key: 'overdue', label: 'Overdue', icon: AlertCircle },
    { key: 'high', label: 'High Priority', icon: Star },
    { key: 'completed_today', label: 'Completed Today', icon: CheckCircle2 },
  ]

  return (
    <aside
      className={cn(
        'w-64 flex-shrink-0 hidden lg:block space-y-4',
        className
      )}
    >
      <Card className="bg-card/50 border border-border">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-foreground">My Tasks Summary</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Open</span>
            <span className="font-medium">{openCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overdue</span>
            <span className="font-medium text-destructive">{overdueCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Done today</span>
            <span className="font-medium">{completedTodayCount}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border border-border">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-foreground">Quick filters</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {quickFilters.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeQuickFilter === key ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onQuickFilter(activeQuickFilter === key ? null : key)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {recentActivity.length > 0 && (
        <Card className="bg-card/50 border border-border">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {recentActivity.slice(0, 5).map((a) => (
                <li key={a.id} className="truncate" title={a.title}>
                  {a.title} — {a.at}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </aside>
  )
}
