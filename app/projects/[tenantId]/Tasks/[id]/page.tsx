'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'

export default function TaskDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const { data: task, isLoading } = useTask(id)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTask.mutateAsync({ id, data: { status: newStatus } })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(id)
        router.push(`/projects/${tenantId}/Tasks`)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete task')
      }
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading task..." fullScreen={false} />
  }

  if (!task) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Task not found</p>
        <Link href={`/projects/${tenantId}/Tasks`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Tasks</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {task.status === 'completed' ? 'Completed' : 'Active Task'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${tenantId}/Tasks`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</div>
                  <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{task.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Priority</div>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    task.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                {task.dueDate && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Due Date</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Completed At</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(task.completedAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.status !== 'completed' && (
                <Button
                  className="w-full dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleStatusChange('completed')}
                  disabled={updateTask.isPending}
                >
                  Mark as Completed
                </Button>
              )}
              {task.status === 'pending' && (
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updateTask.isPending}
                >
                  Start Task
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleStatusChange('pending')}
                  disabled={updateTask.isPending}
                >
                  Mark as Pending
                </Button>
              )}
            </CardContent>
          </Card>

          {task.contact && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Related Contact</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const contact = task.contact
                  if (typeof contact === 'string') {
                    return <span className="font-medium">{contact}</span>
                  }
                  if (typeof contact === 'object' && contact !== null) {
                    const contactName = String(contact.name || contact.email || contact.id || 'Unknown')
                    const contactId = contact.id
                    return contactId ? (
                      <Link
                        href={`/crm/${tenantId}/Contacts/${contactId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {contactName}
                      </Link>
                    ) : (
                      <span className="font-medium">{contactName}</span>
                    )
                  }
                  return <span className="font-medium">{String(contact)}</span>
                })()}
              </CardContent>
            </Card>
          )}

          {task.assignedTo && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const assignedTo = task.assignedTo
                  if (typeof assignedTo === 'string') {
                    return <div className="font-medium text-gray-900 dark:text-gray-100">{assignedTo}</div>
                  }
                  if (typeof assignedTo === 'object' && assignedTo !== null) {
                    return (
                      <>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {String(assignedTo.name || assignedTo.email || assignedTo.id || 'Unknown')}
                        </div>
                        {assignedTo.email && assignedTo.name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{String(assignedTo.email)}</div>
                        )}
                      </>
                    )
                  }
                  return <div className="font-medium text-gray-900 dark:text-gray-100">{String(assignedTo)}</div>
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
