'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDeleteTask, useTask, useUpdateTask } from '@/lib/hooks/use-api'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageLoading } from '@/components/ui/loading'
import { ArrowLeft, Calendar, User, FileText, Trash2, ListTodo, Bot } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

function toDateTimeLocal(value: string | Date | null | undefined) {
  if (!value) return ''
  const parsed = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(parsed.getTime())) return ''
  const offsetMs = parsed.getTimezoneOffset() * 60_000
  const local = new Date(parsed.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

export default function CRMTaskDetailPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const id = (params?.id as string) ?? ''
  const router = useRouter()
  const { data: task, isLoading, isError } = useTask(id, tenantId || undefined)
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const { token } = useAuthStore()
  const { toast, ToastContainer: PageToastContainer } = useToast()
  const [saveSuccess, setSaveSuccess] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending')
  const [dueLocal, setDueLocal] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [saveError, setSaveError] = useState('')

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-task-edit', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=500', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { employees: [] }
      return res.json().catch(() => ({ employees: [] }))
    },
    enabled: !!token,
  })
  const assignableEmployees = (employeesData?.employees || []).filter((e: any) => e.userId)

  useEffect(() => {
    if (!task) return
    const id = globalThis.setTimeout(() => {
      setTitle(task.title ?? '')
      setDescription(task.description ?? '')
      setPriority((task.priority as 'low' | 'medium' | 'high') || 'medium')
      setStatus((task.status as typeof status) || 'pending')
      setDueLocal(toDateTimeLocal(task.dueDate))
      setAssignedToId((task.assignedTo as { id?: string } | null)?.id ?? '')
      setSaveError('')
      setSaveSuccess('')
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [task])

  const handleDelete = async () => {
    if (!confirm('Delete this task? This action cannot be undone.')) return
    try {
      await deleteTask.mutateAsync({ id, tenantId: tenantId || undefined })
      router.push(`/crm/${tenantId}/Tasks`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  const handleSave = async () => {
    setSaveError('')
    if (!title.trim()) {
      setSaveError('Title is required')
      return
    }
    try {
      const data: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
      }
      if (dueLocal) {
        const d = new Date(dueLocal)
        if (!Number.isNaN(d.getTime())) data.dueDate = d.toISOString()
      } else {
        data.dueDate = null
      }
      data.assignedToId = assignedToId || null
      await updateTask.mutateAsync({
        id,
        tenantId: tenantId || undefined,
        data,
      })
      const savedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setSaveSuccess(`Changes saved at ${savedAt}`)
      toast.success('Task updated', 'Changes have been saved.')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save')
      setSaveSuccess('')
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
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                Back to Tasks
              </Button>
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
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
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/crm/${tenantId}/Tasks`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={updateTask.isPending}
            title={updateTask.isPending ? 'Saving…' : 'Save changes'}
          >
            {updateTask.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            title={deleteTask.isPending ? 'Deleting…' : 'Delete task'}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {deleteTask.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}
      {saveSuccess ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
          {saveSuccess}
        </p>
      ) : null}

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <ListTodo className="h-8 w-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <Label htmlFor="task-title" className="sr-only">
                  Title
                </Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold h-auto py-2"
                  placeholder="Task title"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                  >
                    <option value="pending">pending</option>
                    <option value="in_progress">in progress</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-desc" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Description
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Optional details"
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due" className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Due date
            </Label>
            <Input id="task-due" type="datetime-local" value={dueLocal} onChange={(e) => setDueLocal(e.target.value)} />
            <p className="text-xs text-muted-foreground">Clear the field to remove due date.</p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned to</p>
              <select
                className="h-9 min-w-[260px] rounded-md border border-input bg-background px-2 text-sm"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                disabled={updateTask.isPending}
              >
                <option value="">— Unassigned (assign to me) —</option>
                {assignableEmployees.map((emp: any) => (
                  <option key={emp.userId} value={emp.userId}>
                    {emp.firstName} {emp.lastName}
                    {emp.designation?.name ? ` · ${emp.designation.name}` : ''}
                  </option>
                ))}
              </select>
              <CardDescription className="mt-1">
                Current assignee: {assignedName}. Save to apply reassignment.
              </CardDescription>
            </div>
          </div>

          {task.contact && (
            <div className="flex gap-3">
              <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</p>
                <Link
                  href={`/crm/${tenantId}/Contacts/${(task.contact as { id: string }).id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {(task.contact as { name?: string }).name ||
                    (task.contact as { email?: string }).email ||
                    'Contact'}
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {PageToastContainer}
    </div>
  )
}
