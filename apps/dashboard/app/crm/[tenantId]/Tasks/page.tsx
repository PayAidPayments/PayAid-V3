'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  useTasks,
  useUpdateTask,
  useDeleteTask,
  useRemindTask,
  useBulkCompleteTasks,
  useTaskTemplates,
  useCreateTaskFromTemplate,
} from '@/lib/hooks/use-api'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { TasksSidebar } from '@/components/crm/tasks/TasksSidebar'
import { TaskCard } from '@/components/crm/tasks/TaskCard'
import { TasksFilters, type TasksFiltersState } from '@/components/crm/tasks/TasksFilters'
import { TasksCalendarView } from '@/components/crm/tasks/TasksCalendarView'
import { TasksKanbanView } from '@/components/crm/tasks/TasksKanbanView'
import { getModuleConfig } from '@/lib/modules/module-config'
import { format, isPast, startOfMonth, endOfMonth } from 'date-fns'
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  Calendar,
  CheckCircle2,
  Pencil,
  Bell,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const DEFAULT_FILTERS: TasksFiltersState = {
  status: '',
  module: '',
  priority: '',
  dueDateFrom: '',
  dueDateTo: '',
}

const PAGE_SIZES = [25, 50, 100]

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function priorityDot(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-500'
    default:
      return 'bg-gray-400'
  }
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'overdue') return 'destructive'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

export default function CRMTasksPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filters, setFilters] = useState<TasksFiltersState>(DEFAULT_FILTERS)
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [quickFilter, setQuickFilter] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()
  const { data: templatesData } = useTaskTemplates(tenantId || undefined)
  const createFromTemplate = useCreateTaskFromTemplate()
  const templates = templatesData?.templates ?? []
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false)

  useEffect(() => {
    const filterParam = (searchParams?.get('filter') || '').toLowerCase()
    if (filterParam === 'overdue' || filterParam === 'open' || filterParam === 'today' || filterParam === 'completed_today' || filterParam === 'high') {
      const id = globalThis.setTimeout(() => {
        setQuickFilter(filterParam)
        setPage(1)
      }, 0)
      return () => globalThis.clearTimeout(id)
    }
  }, [searchParams])

  const statusParam = useMemo(() => {
    if (quickFilter === 'overdue') return 'overdue'
    if (quickFilter === 'open') return 'open'
    if (quickFilter === 'today') return 'today'
    if (quickFilter === 'completed_today') return 'completed_today'
    if (quickFilter === 'high') return undefined
    return filters.status || undefined
  }, [quickFilter, filters.status])

  const { data, isLoading } = useTasks({
    page,
    limit: pageSize,
    status: statusParam,
    search: debouncedSearch || undefined,
    module: filters.module || undefined,
    priority: quickFilter === 'high' ? 'high' : filters.priority || undefined,
    dueDateFrom: filters.dueDateFrom || undefined,
    dueDateTo: filters.dueDateTo || undefined,
    stats: true,
    tenantId: tenantId || undefined,
  })

  const calendarRange = useMemo(() => {
    const start = startOfMonth(calendarMonth)
    const end = endOfMonth(calendarMonth)
    return {
      dueDateFrom: start.toISOString(),
      dueDateTo: end.toISOString(),
    }
  }, [calendarMonth])

  const { data: calendarData } = useTasks({
    page: 1,
    limit: 500,
    dueDateFrom: view === 'calendar' ? calendarRange.dueDateFrom : undefined,
    dueDateTo: view === 'calendar' ? calendarRange.dueDateTo : undefined,
    stats: false,
    tenantId: tenantId || undefined,
  })
  const calendarTasks = view === 'calendar' ? (calendarData?.tasks ?? []) : []

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const remindTask = useRemindTask()
  const bulkComplete = useBulkCompleteTasks()

  const tasks = data?.tasks ?? []
  const pagination = data?.pagination
  const stats = data?.stats ?? {
    openCount: 0,
    overdueCount: 0,
    completedTodayCount: 0,
  }
  const total = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1

  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length
  const someSelected = selectedIds.size > 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(tasks.map((t: { id: string }) => t.id)))
    else setSelectedIds(new Set())
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleBulkComplete = () => {
    if (selectedIds.size === 0) return
    bulkComplete.mutate(
      { ids: Array.from(selectedIds), tenantId: tenantId || undefined },
      {
        onSuccess: () => setSelectedIds(new Set()),
      }
    )
  }

  const handleExportCSV = () => {
    const headers = ['Title', 'Client', 'Assignee', 'Due', 'Status', 'Priority', 'Module']
    const rows = tasks.map((t: any) => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.contact?.name ?? '').replace(/"/g, '""')}"`,
      `"${(t.assignedTo?.name ?? '').replace(/"/g, '""')}"`,
      t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '',
      t.status ?? '',
      t.priority ?? '',
      t.module ?? 'crm',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const recentActivity = useMemo(
    () =>
      tasks.slice(0, 5).map((t: any) => ({
        id: t.id,
        title: t.title,
        at: t.updatedAt ? format(new Date(t.updatedAt), 'MMM d') : '',
      })),
    [tasks]
  )

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setQuickFilter(null)
    setPage(1)
  }

  if (isLoading && !data) {
    return <PageLoading message="Loading tasks..." fullScreen={false} />
  }

  const moduleConfig = getModuleConfig('crm')

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-full">
      {/* AI Next 5 Actions placeholder */}
      <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">Next 5 actions</strong> — AI prioritization coming soon. Focus on overdue and high-priority tasks first.
        </span>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Tasks {total > 0 && `(${total.toLocaleString()})`}
          </h1>
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, clients..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(1)
                }}
                className="pl-9 bg-background"
              />
            </div>
          </div>
          <TasksFilters
            filters={filters}
            onFiltersChange={(f) => {
              setFilters(f)
              setPage(1)
            }}
            onClear={clearFilters}
          />
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            {[
              { key: 'list', icon: List, label: 'List' },
              { key: 'kanban', icon: LayoutGrid, label: 'Kanban' },
              { key: 'calendar', icon: Calendar, label: 'Calendar' },
            ].map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                variant={view === key ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1"
                onClick={() => setView(key as 'list' | 'kanban' | 'calendar')}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/crm/${tenantId}/Tasks/new`}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </Link>
            {templates.length > 0 && (
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setTemplateDropdownOpen((o) => !o)}
                  onBlur={() => setTimeout(() => setTemplateDropdownOpen(false), 150)}
                >
                  From template
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {templateDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
                    {templates.map((tpl: { id: string; name: string; title: string }) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => {
                          createFromTemplate.mutate(
                            { templateId: tpl.id, tenantId: tenantId || undefined },
                            {
                              onSuccess: (task: { id: string }) => {
                                setTemplateDropdownOpen(false)
                                router.push(`/crm/${tenantId}/Tasks/${task.id}`)
                              },
                            }
                          )
                        }}
                        disabled={createFromTemplate.isPending}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-card/50 border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => {
              setQuickFilter(quickFilter === 'open' ? null : 'open')
              setFilters((f) => ({ ...f, status: '' }))
              setPage(1)
            }}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              !quickFilter || quickFilter === 'open'
                ? 'bg-secondary text-secondary-foreground border-transparent'
                : 'bg-transparent hover:bg-muted'
            )}
          >
            Open {stats.openCount}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickFilter(quickFilter === 'overdue' ? null : 'overdue')
              setPage(1)
            }}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              quickFilter === 'overdue'
                ? 'bg-destructive text-destructive-foreground border-transparent'
                : 'bg-transparent hover:bg-muted text-destructive'
            )}
          >
            Overdue {stats.overdueCount}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickFilter(quickFilter === 'completed_today' ? null : 'completed_today')
              setPage(1)
            }}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              quickFilter === 'completed_today'
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'bg-transparent hover:bg-muted'
            )}
          >
            Completed Today {stats.completedTodayCount}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        <TasksSidebar
          openCount={stats.openCount}
          overdueCount={stats.overdueCount}
          completedTodayCount={stats.completedTodayCount}
          activeQuickFilter={quickFilter}
          onQuickFilter={setQuickFilter}
          recentActivity={recentActivity}
        />

        <main className="flex-1 min-w-0">
          {view === 'calendar' && (
            <TasksCalendarView
              tasks={calendarTasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                dueDate: t.dueDate,
                priority: t.priority,
                status: t.status,
              }))}
              tenantId={tenantId}
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
            />
          )}

          {view === 'list' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                  {someSelected && (
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {someSelected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkComplete}
                      disabled={bulkComplete.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <Card className="flex-1 min-w-0 overflow-hidden">
                {tasks.length === 0 ? (
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p className="mb-4">No tasks match your filters.</p>
                    <Link href={`/crm/${tenantId}/Tasks/new`}>
                      <Button>Create task</Button>
                    </Link>
                  </CardContent>
                ) : (
                  <div className="overflow-x-auto min-w-0">
                  <Table className="w-full table-auto text-sm">
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                        <TableHead className="w-10 py-3 pl-4 pr-2" />
                        <TableHead className="w-8 py-3 px-2" />
                        <TableHead className="min-w-[220px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Task</TableHead>
                        <TableHead className="min-w-[180px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Client</TableHead>
                        <TableHead className="min-w-[120px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Assignee</TableHead>
                        <TableHead className="w-[100px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Due</TableHead>
                        <TableHead className="w-[100px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Status</TableHead>
                        <TableHead className="w-[100px] py-3 pl-3 pr-4 text-right text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-gray-700">
                      {tasks.map((task: any) => {
                        const due = task.dueDate ? new Date(task.dueDate) : null
                        const isOverdue =
                          due &&
                          isPast(due) &&
                          task.status !== 'completed' &&
                          task.status !== 'cancelled'
                        return (
                          <TableRow key={task.id}>
                            <TableCell className="py-3 pl-4 pr-2">
                              <Checkbox
                                checked={selectedIds.has(task.id)}
                                onCheckedChange={(c) =>
                                  handleSelectOne(task.id, c === true)
                                }
                                aria-label={`Select ${task.title}`}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-2">
                              <div
                                className={cn(
                                  'h-2 w-2 rounded-full',
                                  priorityDot(task.priority)
                                )}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-3 font-medium min-w-0">
                              <Link
                                href={`/crm/${tenantId}/Tasks/${task.id}`}
                                className="text-primary hover:underline block truncate"
                                title={task.title}
                              >
                                {task.title}
                              </Link>
                            </TableCell>
                            <TableCell className="py-3 px-3 min-w-0">
                              {task.contactId ? (
                                <Link
                                  href={`/crm/${tenantId}/Contacts/${task.contactId}`}
                                  className="text-primary hover:underline text-sm block truncate"
                                  title={task.contact?.name ?? undefined}
                                >
                                  {task.contact?.name ?? '—'}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-3 text-sm">
                              {task.assignedTo?.name ?? 'Unassigned'}
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <span
                                className={cn(
                                  isOverdue && 'text-destructive font-medium'
                                )}
                              >
                                {due ? format(due, 'MMM d, yyyy') : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <Badge variant={statusVariant(task.status)}>
                                {task.status?.replace('_', ' ') ?? 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 pl-3 pr-4 text-right">
                              <div className="flex justify-end gap-1">
                                {task.status !== 'completed' &&
                                  task.status !== 'cancelled' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        updateTask.mutate({
                                          id: task.id,
                                          data: { status: 'completed' },
                                          tenantId: tenantId || undefined,
                                        })
                                      }
                                    >
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                <Link href={`/crm/${tenantId}/Tasks/${task.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    remindTask.mutate({ id: task.id, tenantId: tenantId || undefined })
                                  }
                                  title="Send reminder"
                                >
                                  <Bell className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </Card>

              {/* Pagination */}
              {pagination && totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n} per page
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {view === 'kanban' && (
            <TasksKanbanView
              tasks={tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                status: t.status,
                dueDate: t.dueDate,
                contact: t.contact,
                assignedTo: t.assignedTo,
                reminderSentAt: t.reminderSentAt,
              }))}
              tenantId={tenantId}
              onComplete={(id) =>
                updateTask.mutate({
                  id,
                  data: { status: 'completed' },
                  tenantId: tenantId || undefined,
                })
              }
              onRemind={(id) => remindTask.mutate({ id, tenantId: tenantId || undefined })}
              onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
            />
          )}
        </main>
      </div>
    </div>
  )
}
