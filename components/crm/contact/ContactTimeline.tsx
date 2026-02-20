'use client'

import { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Briefcase,
  Plus,
  Filter,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

interface Activity {
  id: string
  type: 'email' | 'call' | 'whatsapp' | 'meeting' | 'note' | 'task' | 'deal' | 'system'
  title: string
  description?: string
  createdAt: string
  metadata?: any
}

interface ContactTimelineProps {
  contactId: string
  tenantId: string
  tasks?: any[]
  notes?: string
}

type ActivityFilter = 'all' | 'email' | 'call' | 'whatsapp' | 'meeting' | 'note' | 'task' | 'deal'

export const ContactTimeline: React.FC<ContactTimelineProps> = ({ contactId, tenantId, tasks = [], notes }) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const { token } = useAuthStore()

  useEffect(() => {
    const fetchActivities = async () => {
      if (!token) return
      
      setIsLoading(true)
      try {
        // Fetch interactions (calls, emails, WhatsApp, meetings)
        const interactionsRes = await fetch(`/api/interactions?contactId=${contactId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const interactionsData = interactionsRes.ok ? await interactionsRes.json() : { interactions: [] }

        // Tasks and notes are passed as props, will be used in normalization below

        // Fetch deals
        const dealsRes = await fetch(`/api/deals?contactId=${contactId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const dealsData = dealsRes.ok ? await dealsRes.json() : { deals: [] }

        // Combine and normalize activities
        const allActivities: Activity[] = [
          ...(interactionsData.interactions || []).map((i: any) => ({
            id: i.id,
            type: (i.type === 'email' ? 'email' : i.type === 'whatsapp' ? 'whatsapp' : i.type === 'meeting' ? 'meeting' : 'call') as Activity['type'],
            title: i.subject || `${i.type} with ${i.contact?.name || 'contact'}`,
            description: i.notes || i.outcome || undefined,
            createdAt: i.createdAt,
            metadata: i,
          })),
          ...(tasks || []).map((t: any) => ({
            id: t.id,
            type: 'task' as const,
            title: t.title || 'Task',
            description: t.description || undefined,
            createdAt: t.createdAt || t.dueDate || new Date().toISOString(),
            metadata: t,
          })),
          ...(notes ? [{
            id: 'note-1',
            type: 'note' as const,
            title: 'Note',
            description: notes,
            createdAt: new Date().toISOString(),
            metadata: { content: notes },
          }] : []),
          ...(dealsData.deals || []).map((d: any) => ({
            id: d.id,
            type: 'deal' as const,
            title: `Deal: ${d.name}`,
            description: `₹${d.value?.toLocaleString() || '0'} • ${d.stage}`,
            createdAt: d.createdAt,
            metadata: d,
          })),
        ]

        // Sort by date (newest first)
        allActivities.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setActivities(allActivities)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [contactId, token, tasks, notes])

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />
      case 'meeting': return <Calendar className="w-4 h-4" />
      case 'note': return <FileText className="w-4 h-4" />
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'deal': return <Briefcase className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500'
      case 'call': return 'bg-green-500'
      case 'whatsapp': return 'bg-emerald-500'
      case 'meeting': return 'bg-purple-500'
      case 'note': return 'bg-yellow-500'
      case 'task': return 'bg-indigo-500'
      case 'deal': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const filters: { key: ActivityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'email', label: 'Emails' },
    { key: 'call', label: 'Calls' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'meeting', label: 'Meetings' },
    { key: 'note', label: 'Notes' },
    { key: 'task', label: 'Tasks' },
    { key: 'deal', label: 'Deals' },
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Activity Timeline</h2>
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  filter === f.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          {/* Add Activity Button */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="ml-2 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Activity
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50">
                <div className="py-1">
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                    <Phone className="w-4 h-4 mr-3" />
                    Log Call
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                    <FileText className="w-4 h-4 mr-3" />
                    Add Note
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                    <CheckCircle className="w-4 h-4 mr-3" />
                    Create Task
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                    <Calendar className="w-4 h-4 mr-3" />
                    Schedule Meeting
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="overflow-y-auto max-h-[360px]">
        {isLoading ? (
          <div className="text-center py-4 text-xs text-slate-500 dark:text-gray-400">
            Loading activities...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-400 dark:text-gray-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {filter === 'all' ? 'No activities yet' : `No ${filters.find(f => f.key === filter)?.label.toLowerCase()} activities`}
            </p>
            <button
              onClick={() => setShowAddMenu(true)}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Add activity
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <li key={activity.id} className="flex items-start gap-3 relative">
                {/* Timeline line */}
                {index < filteredActivities.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200 dark:bg-gray-700" />
                )}
                
                {/* Icon */}
                <div className={`relative z-10 mt-1 flex-shrink-0 w-6 h-6 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 block">
                        {activity.title}
                      </span>
                      {activity.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
