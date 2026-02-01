'use client'

import { useState } from 'react'
import { Mail, Phone, Calendar, FileText, MessageSquare, Video, CheckCircle, Clock, X } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface TimelineItem {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'sms' | 'whatsapp'
  title: string
  description?: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
  metadata?: {
    duration?: number
    status?: string
    subject?: string
    direction?: 'inbound' | 'outbound'
    recordingUrl?: string
  }
}

interface CommunicationTimelineProps {
  contactId?: string
  dealId?: string
  tenantId: string
  items?: TimelineItem[]
}

export function CommunicationTimeline({ contactId, dealId, tenantId, items = [] }: CommunicationTimelineProps) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter)

  const groupedItems = filteredItems.reduce((acc, item) => {
    const date = format(item.timestamp, 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {} as Record<string, TimelineItem[]>)

  const getIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'call':
        return <Phone className="w-4 h-4" />
      case 'meeting':
        return <Calendar className="w-4 h-4" />
      case 'note':
        return <FileText className="w-4 h-4" />
      case 'task':
        return <CheckCircle className="w-4 h-4" />
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      case 'call':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      case 'meeting':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
      case 'note':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'task':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
      case 'sms':
      case 'whatsapp':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'email' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('email')}
        >
          <Mail className="w-4 h-4 mr-1" />
          Emails
        </Button>
        <Button
          variant={filter === 'call' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('call')}
        >
          <Phone className="w-4 h-4 mr-1" />
          Calls
        </Button>
        <Button
          variant={filter === 'meeting' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('meeting')}
        >
          <Calendar className="w-4 h-4 mr-1" />
          Meetings
        </Button>
        <Button
          variant={filter === 'note' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('note')}
        >
          <FileText className="w-4 h-4 mr-1" />
          Notes
        </Button>
        <Button
          variant={filter === 'task' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('task')}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Tasks
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedItems).map(([date, dateItems]) => (
          <div key={date} className="relative">
            {/* Date Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 py-2 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>

            {/* Timeline Items */}
            <div className="space-y-4">
              {dateItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-4"
                >
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColor(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    {idx < dateItems.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {item.title}
                            </h4>
                            {item.metadata?.direction && (
                              <Badge variant="outline" className="text-xs">
                                {item.metadata.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                              </Badge>
                            )}
                            {item.metadata?.status && (
                              <Badge variant="outline" className="text-xs">
                                {item.metadata.status}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {expandedItems.has(item.id) || item.description.length < 100
                                ? item.description
                                : `${item.description.substring(0, 100)}...`}
                            </p>
                          )}
                          {item.description && item.description.length > 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(item.id)}
                              className="text-xs"
                            >
                              {expandedItems.has(item.id) ? 'Show less' : 'Show more'}
                            </Button>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(item.timestamp, 'h:mm a')}
                            </span>
                            {item.user && (
                              <span>by {item.user.name}</span>
                            )}
                            {item.metadata?.duration && (
                              <span>{item.metadata.duration} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No communication history found</p>
          </div>
        )}
      </div>
    </div>
  )
}
