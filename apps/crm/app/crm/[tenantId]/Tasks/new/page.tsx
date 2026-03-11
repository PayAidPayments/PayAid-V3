'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateTask } from '@/lib/hooks/use-api'
import { useContacts } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ListTodo } from 'lucide-react'

export default function NewCRMTaskPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const router = useRouter()
  const createTask = useCreateTask()
  const { data: contactsData } = useContacts()
  const contacts = contactsData?.contacts ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    dueDate: '',
    contactId: '',
    recurrenceRule: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    recurrenceEndDate: '',
  })
  const [error, setError] = useState('')

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
            New Task
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a task and link it to a contact (optional)</p>
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
                {contacts.map((c: { id: string; name?: string; email?: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email || c.id}
                  </option>
                ))}
              </select>
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
                {createTask.isPending ? 'Creating…' : 'Create task'}
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
