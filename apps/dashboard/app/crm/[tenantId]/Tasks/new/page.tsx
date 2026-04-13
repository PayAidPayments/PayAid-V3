'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCreateTask } from '@/lib/hooks/use-api'
import { useContacts } from '@/lib/hooks/use-api'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ListTodo, User } from 'lucide-react'

export default function NewCRMTaskPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const searchParams = useSearchParams()
  const router = useRouter()
  const createTask = useCreateTask()
  const { data: contactsData } = useContacts()
  const contacts = contactsData?.contacts ?? []
  const { token } = useAuthStore()

  // Fetch employees from HR to populate the assignee dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-task-assign'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=500', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { employees: [] }
      return res.json().catch(() => ({ employees: [] }))
    },
    enabled: !!token,
  })
  // Only show employees who have a linked user account (userId is set)
  const assignableEmployees = (employeesData?.employees || []).filter((e: any) => e.userId)

  const prefillTitle = (searchParams?.get('title') || '').trim()
  const prefillContactId = (searchParams?.get('contactId') || '').trim()
  const prefillType = (searchParams?.get('type') || '').trim().toLowerCase()
  const prefillPriorityParam = (searchParams?.get('priority') || '').trim().toLowerCase()
  const prefillDueDateParam = (searchParams?.get('dueDate') || '').trim()
  const isMeetingPrefill = prefillType === 'meeting'
  const prefillPriority: 'low' | 'medium' | 'high' | null =
    prefillPriorityParam === 'low' || prefillPriorityParam === 'medium' || prefillPriorityParam === 'high'
      ? prefillPriorityParam
      : null

  const toDateTimeLocal = (value: string) => {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    const offsetMs = parsed.getTimezoneOffset() * 60_000
    const local = new Date(parsed.getTime() - offsetMs)
    return local.toISOString().slice(0, 16)
  }

  const prefillDueDate = toDateTimeLocal(prefillDueDateParam)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    dueDate: '',
    contactId: '',
    assignedToId: '',
    recurrenceRule: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    recurrenceEndDate: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!prefillTitle && !prefillContactId && !isMeetingPrefill && !prefillPriority && !prefillDueDate) return
    setFormData((prev) => ({
      ...prev,
      title: prefillTitle || (isMeetingPrefill && !prev.title ? 'Schedule meeting' : prev.title),
      contactId: prefillContactId || prev.contactId,
      priority: prefillPriority || prev.priority,
      dueDate: prefillDueDate || prev.dueDate,
      description:
        prev.description ||
        (isMeetingPrefill ? 'Meeting requested from activity quick action.' : prev.description),
    }))
  }, [prefillTitle, prefillContactId, isMeetingPrefill, prefillPriority, prefillDueDate])

  const selectedContactMissingFromList =
    !!formData.contactId &&
    !contacts.some((c: { id: string }) => c.id === formData.contactId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        priority: formData.priority,
        status: formData.status,
      }
      if (formData.description.trim()) payload.description = formData.description.trim()
      if (formData.dueDate) {
        const d = new Date(formData.dueDate)
        if (!isNaN(d.getTime())) payload.dueDate = d.toISOString()
      }
      if (formData.contactId) payload.contactId = formData.contactId
      if (formData.assignedToId) payload.assignedToId = formData.assignedToId
      if (formData.recurrenceRule && formData.recurrenceRule !== 'none') {
        payload.recurrenceRule = formData.recurrenceRule
        if (formData.recurrenceEndDate) {
          const end = new Date(formData.recurrenceEndDate)
          if (!isNaN(end.getTime())) payload.recurrenceEndDate = end.toISOString()
        }
      }

      await createTask.mutateAsync(payload)
      router.push(`/crm/${tenantId}/Tasks`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      setError(message)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = e.target.name
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ListTodo className="w-8 h-8" />
            {isMeetingPrefill ? 'Schedule Meeting' : 'New Task'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isMeetingPrefill
              ? 'Create a meeting task with prefilled contact context.'
              : 'Create a task and link it to a contact (optional)'}
          </p>
        </div>
        <Link href={`/crm/${tenantId}/Tasks`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            Cancel
          </Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Task details</CardTitle>
          <CardDescription className="dark:text-gray-400">Fill in the task information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Follow up with client"
                disabled={createTask.isPending}
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Optional notes"
                disabled={createTask.isPending}
                className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={createTask.isPending}
                  className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={createTask.isPending}
                  className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due date
              </label>
              <Input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleChange}
                disabled={createTask.isPending}
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contactId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact (optional)
              </label>
              <select
                id="contactId"
                name="contactId"
                value={formData.contactId}
                onChange={handleChange}
                disabled={createTask.isPending}
                className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">— None —</option>
                {selectedContactMissingFromList && (
                  <option value={formData.contactId}>
                    Prefilled contact ({formData.contactId})
                  </option>
                )}
                {contacts.map((c: { id: string; name?: string; email?: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email || c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="assignedToId" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <User className="w-4 h-4" />
                Assign To (optional)
              </label>
              <select
                id="assignedToId"
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleChange}
                disabled={createTask.isPending}
                className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">— Unassigned (assign to me) —</option>
                {assignableEmployees.map((emp: any) => (
                  <option key={emp.userId} value={emp.userId}>
                    {emp.firstName} {emp.lastName} {emp.designation?.name ? `· ${emp.designation.name}` : ''} {emp.department?.name ? `(${emp.department.name})` : ''}
                  </option>
                ))}
              </select>
              {assignableEmployees.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No employees with linked accounts found. Employees need a PayAid user account to be assigned tasks.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="recurrenceRule" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repeats
                </label>
                <select
                  id="recurrenceRule"
                  name="recurrenceRule"
                  value={formData.recurrenceRule}
                  onChange={handleChange}
                  disabled={createTask.isPending}
                  className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="none">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {formData.recurrenceRule !== 'none' && (
                <div className="space-y-2">
                  <label htmlFor="recurrenceEndDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Repeat until
                  </label>
                  <input
                    id="recurrenceEndDate"
                    name="recurrenceEndDate"
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    disabled={createTask.isPending}
                    className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? 'Creating…' : isMeetingPrefill ? 'Create meeting task' : 'Create task'}
              </Button>
              <Link href={`/crm/${tenantId}/Tasks`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  Back to tasks
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
