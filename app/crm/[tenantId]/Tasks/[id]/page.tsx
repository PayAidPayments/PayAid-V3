'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDeleteTask, useTask } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { ArrowLeft, Calendar, User, FileText, Trash2, ListTodo, Bot } from 'lucide-react'

export default function CRMTaskDetailPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const id = (params?.id as string) ?? ''
  const router = useRouter()
  const { data: task, isLoading, isError } = useTask(id, tenantId || undefined)
  const deleteTask = useDeleteTask()

  const handleDelete = async () => {
    if (!confirm('Delete this task? This action cannot be undone.')) return
    try {
      await deleteTask.mutateAsync(id)
      router.push(`/crm/${tenantId}/Tasks`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading task..." fullScreen={false} />
  }

  if (isError || !task) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Task not found or you don’t have access to it.</p>
            <Link href={`/crm/${tenantId}/Tasks`}>
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">Back to Tasks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const assignedName =
    task.assignedTo && typeof task.assignedTo === 'object'
      ? (task.assignedTo as { name?: string; email?: string }).name ||
        (task.assignedTo as { email?: string }).email ||
        'Unassigned'
      : 'Unassigned'
  const dueDate = task.dueDate ? format(new Date(task.dueDate), 'PPP') : null
  const priority = (task.priority || 'medium') as string
  const status = (task.status || 'pending') as string

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5"
        >
          <Bot className="w-3.5 h-3.5" />
          Ask PayAid AI about this task
        </button>
      </div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href={`/crm/${tenantId}/Tasks`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {deleteTask.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <ListTodo className="h-8 w-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">{task.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {priority}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : status === 'cancelled'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}
                >
                  {status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{task.description}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{dueDate ?? '—'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned to</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{assignedName}</p>
            </div>
          </div>

          {task.contact && (
            <div className="flex gap-3">
              <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</p>
                <Link
                  href={`/crm/${tenantId}/Contacts/${(task.contact as { id: string }).id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {(task.contact as { name?: string }).name || (task.contact as { email?: string }).email || 'Contact'}
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
