'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTasks, useDeleteTask } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format, isToday, isPast, isFuture, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { AlertCircle, CheckCircle2, Clock, Calendar, TrendingUp, AlertTriangle, Undo2 } from 'lucide-react'

const UNDO_DELETE_SECONDS = 30

// Task Row Component
function TaskRow({ task, tenantId, onDelete }: { task: any; tenantId: string; onDelete: (id: string) => void }) {
  const getAssignedToName = () => {
    const assignedTo = task.assignedTo
    if (!assignedTo) return 'Unassigned'
    if (typeof assignedTo === 'string') return assignedTo
    if (typeof assignedTo === 'object') {
      return String(assignedTo.name || assignedTo.email || assignedTo.id || 'Unassigned')
    }
    return String(assignedTo)
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 transition-colors">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1">
          <Link 
            href={`/crm/${tenantId}/Tasks/${task.id}`} 
            className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {task.title}
          </Link>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Assigned to: {getAssignedToName()}</span>
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            task.priority === 'high' ? 'bg-red-100 text-red-800' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {task.priority || 'low'}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            task.status === 'completed' ? 'bg-green-100 text-green-800' :
            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {task.status?.replace('_', ' ') || 'pending'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Link href={`/crm/${tenantId}/Tasks/${task.id}`}>
          <Button variant="ghost" size="sm">View</Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(task.id)}
          className="text-red-600 hover:text-red-700"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

export default function CRMTasksPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number | null>(null)
  const undoDeleteId = searchParams?.get('undoDelete') ?? null
  const deleteTask = useDeleteTask()
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data, isLoading } = useTasks({ page, limit: 1000, status: statusFilter || undefined })

  // Handle URL query parameters (filter)
  useEffect(() => {
    const filter = searchParams?.get('filter')
    if (filter) {
      if (filter === 'overdue') setSelectedCategory('overdue')
      else if (filter === 'today') setSelectedCategory('today')
      else if (filter === 'thisWeek') setSelectedCategory('thisWeek')
      else if (filter === 'completed') setSelectedCategory('completed')
    }
  }, [searchParams])

  // Pending delete: 30s timer then actually delete; countdown for display
  useEffect(() => {
    if (!undoDeleteId) {
      setUndoSecondsLeft(null)
      return
    }
    setUndoSecondsLeft(UNDO_DELETE_SECONDS)
    const countdown = setInterval(() => {
      setUndoSecondsLeft((s) => {
        if (s === null || s <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          return null
        }
        return s - 1
      })
    }, 1000)
    countdownIntervalRef.current = countdown
    const timeout = setTimeout(() => {
      deleteTask.mutate(undoDeleteId, {
        onSettled: () => {
          const url = new URL(window.location.href)
          url.searchParams.delete('undoDelete')
          router.replace(url.pathname + url.search)
        },
      })
    }, UNDO_DELETE_SECONDS * 1000)
    deleteTimeoutRef.current = timeout
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [undoDeleteId])

  const handleUndoDelete = () => {
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    deleteTimeoutRef.current = null
    countdownIntervalRef.current = null
    setUndoSecondsLeft(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('undoDelete')
    router.replace(url.pathname + url.search)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this task? You can undo within 30 seconds.')) return
    const url = new URL(window.location.href)
    url.searchParams.set('undoDelete', id)
    router.replace(url.pathname + url.search)
  }

  // Tasks to display: exclude the one pending delete (optimistic hide)
  const tasksForDisplay = useMemo(() => {
    const list = data?.tasks ?? []
    if (!undoDeleteId) return list
    return list.filter((t: any) => t.id !== undoDeleteId)
  }, [data?.tasks, undoDeleteId])

  // Categorize tasks (using filtered list)
  const categorizedTasks = useMemo(() => {
    if (!tasksForDisplay.length) return {
      overdue: [],
      today: [],
      thisWeek: [],
      upcoming: [],
      completed: [],
      all: []
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const overdue: any[] = []
    const today: any[] = []
    const thisWeek: any[] = []
    const upcoming: any[] = []
    const completed: any[] = []

    tasksForDisplay.forEach((task: any) => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        completed.push(task)
        return
      }

      if (!task.dueDate) {
        upcoming.push(task)
        return
      }

      const dueDate = new Date(task.dueDate)
      
      if (isPast(dueDate) && !isToday(dueDate)) {
        overdue.push(task)
      } else if (isToday(dueDate)) {
        today.push(task)
      } else if (dueDate <= weekEnd) {
        thisWeek.push(task)
      } else {
        upcoming.push(task)
      }
    })

    return {
      overdue: overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      today: today.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      thisWeek: thisWeek.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      upcoming: upcoming.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }),
      completed,
      all: tasksForDisplay
    }
  }, [tasksForDisplay])

  const stats = useMemo(() => {
    const all = categorizedTasks.all
    return {
      total: all.length,
      overdue: categorizedTasks.overdue.length,
      today: categorizedTasks.today.length,
      thisWeek: categorizedTasks.thisWeek.length,
      upcoming: categorizedTasks.upcoming.length,
      completed: categorizedTasks.completed.length,
      pending: all.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
    }
  }, [categorizedTasks])

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const tasks = tasksForDisplay

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 relative" style={{ zIndex: 1 }}>
      {/* Undo delete banner */}
      {undoDeleteId && undoSecondsLeft !== null && (
        <div className="sticky top-0 z-10 mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Task deleted. You can undo within <strong>{undoSecondsLeft}</strong> second{undoSecondsLeft !== 1 ? 's' : ''}.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-300 dark:hover:bg-amber-900/50"
            onClick={handleUndoDelete}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo
          </Button>
        </div>
      )}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your tasks and activities</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/crm/${tenantId}/Tasks/new`}>
              <Button>New Task</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className={`border-red-200 bg-red-50 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'overdue' ? 'ring-2 ring-red-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'overdue' ? null : 'overdue')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
              <p className="text-xs text-red-700 mt-1">Tasks past due date</p>
              {selectedCategory === 'overdue' && (
                <p className="text-xs text-red-600 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`border-orange-200 bg-orange-50 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'today' ? 'ring-2 ring-orange-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'today' ? null : 'today')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Due Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.today}</div>
              <p className="text-xs text-orange-700 mt-1">Tasks due today</p>
              {selectedCategory === 'today' && (
                <p className="text-xs text-orange-600 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`border-blue-200 bg-blue-50 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'thisWeek' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'thisWeek' ? null : 'thisWeek')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.thisWeek}</div>
              <p className="text-xs text-blue-700 mt-1">Tasks due this week</p>
              {selectedCategory === 'thisWeek' && (
                <p className="text-xs text-blue-600 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`border-green-200 bg-green-50 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'completed' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'completed' ? null : 'completed')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
              <p className="text-xs text-green-700 mt-1">Completed tasks</p>
              {selectedCategory === 'completed' && (
                <p className="text-xs text-green-600 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Show filtered view when a stat card is clicked */}
        {selectedCategory && (
          <div className="space-y-4">
            {selectedCategory === 'overdue' && categorizedTasks.overdue.length > 0 && (
              <Card className="border-red-200 ring-2 ring-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Overdue Tasks ({categorizedTasks.overdue.length})
                      </CardTitle>
                      <CardDescription>Tasks that are past their due date</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.overdue.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCategory === 'today' && categorizedTasks.today.length > 0 && (
              <Card className="border-orange-200 ring-2 ring-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-orange-800 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Due Today ({categorizedTasks.today.length})
                      </CardTitle>
                      <CardDescription>Tasks that need to be completed today</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.today.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCategory === 'thisWeek' && categorizedTasks.thisWeek.length > 0 && (
              <Card className="border-blue-200 ring-2 ring-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Due This Week ({categorizedTasks.thisWeek.length})
                      </CardTitle>
                      <CardDescription>Tasks due within the next 7 days</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.thisWeek.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCategory === 'completed' && categorizedTasks.completed.length > 0 && (
              <Card className="border-green-200 ring-2 ring-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Completed Tasks ({categorizedTasks.completed.length})
                      </CardTitle>
                      <CardDescription>Tasks that have been completed or cancelled</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.completed.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show message if selected category is empty */}
            {((selectedCategory === 'overdue' && categorizedTasks.overdue.length === 0) ||
              (selectedCategory === 'today' && categorizedTasks.today.length === 0) ||
              (selectedCategory === 'thisWeek' && categorizedTasks.thisWeek.length === 0) ||
              (selectedCategory === 'completed' && categorizedTasks.completed.length === 0)) && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 mb-2">No tasks found in this category</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Show All Tasks
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Show all categories when no filter is selected */}
        {!selectedCategory && (
          <>
            {/* Overdue Tasks */}
            {categorizedTasks.overdue.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Overdue Tasks ({categorizedTasks.overdue.length})
                  </CardTitle>
                  <CardDescription>Tasks that are past their due date</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.overdue.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Tasks */}
            {categorizedTasks.today.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Due Today ({categorizedTasks.today.length})
                  </CardTitle>
                  <CardDescription>Tasks that need to be completed today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.today.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* This Week's Tasks */}
            {categorizedTasks.thisWeek.length > 0 && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Due This Week ({categorizedTasks.thisWeek.length})
                  </CardTitle>
                  <CardDescription>Tasks due within the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.thisWeek.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Tasks */}
            {categorizedTasks.upcoming.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Upcoming Tasks ({categorizedTasks.upcoming.length})
                  </CardTitle>
                  <CardDescription>Tasks scheduled for later</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorizedTasks.upcoming.map((task: any) => (
                      <TaskRow key={task.id} task={task} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No tasks found</p>
              <Link href={`/crm/${tenantId}/Tasks/new`}>
                <Button>Create Your First Task</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

