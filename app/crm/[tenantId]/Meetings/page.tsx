'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Video,
  MapPin
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface Meeting {
  id: string
  title: string
  description?: string
  contactId?: string
  contactName?: string
  contactEmail?: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  qualificationScore?: number
  isQualified?: boolean
  meetingType: 'call' | 'video' | 'in-person'
  location?: string
  notes?: string
  aiInsights?: {
    intent: 'high' | 'medium' | 'low'
    recommendedAction: string
    riskFactors: string[]
  }
}

export default function MeetingsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today' | 'qualified'>('all')

  useEffect(() => {
    fetchMeetings()
  }, [tenantId, token, filter])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      if (!token) return

      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('filter', filter)
      }

      const response = await fetch(`/api/crm/meetings?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      } else {
        setMeetings([])
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'high':
        return 'text-green-600 dark:text-green-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (loading) {
    return <PageLoading message="Loading meetings..." fullScreen={false} />
  }

  const upcomingMeetings = meetings.filter(m => 
    new Date(m.startTime) > new Date() && m.status !== 'cancelled'
  )
  const todayMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.startTime)
    const today = new Date()
    return meetingDate.toDateString() === today.toDateString() && m.status !== 'cancelled'
  })
  const qualifiedMeetings = meetings.filter(m => m.isQualified)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meetings & Calendar</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-powered meeting qualification, scheduling, and management
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {upcomingMeetings.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {todayMeetings.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Qualified</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {qualifiedMeetings.length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {meetings.filter(m => m.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meetings</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'today'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilter('qualified')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'qualified'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Qualified
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{meeting.title}</h3>
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                        {meeting.isQualified && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Qualified
                          </Badge>
                        )}
                        {meeting.aiInsights && (
                          <Badge variant="outline" className={getIntentColor(meeting.aiInsights.intent)}>
                            {meeting.aiInsights.intent} intent
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {meeting.contactName && (
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {meeting.contactName} {meeting.contactEmail && `(${meeting.contactEmail})`}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(meeting.startTime), 'MMM dd, yyyy HH:mm')} - {format(new Date(meeting.endTime), 'HH:mm')}
                        </p>
                        <p className="flex items-center gap-2">
                          {meeting.meetingType === 'video' ? (
                            <Video className="h-4 w-4" />
                          ) : meeting.meetingType === 'in-person' ? (
                            <MapPin className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                          {meeting.meetingType === 'video' ? 'Video Call' : meeting.meetingType === 'in-person' ? meeting.location || 'In-Person' : 'Phone Call'}
                        </p>
                        {meeting.qualificationScore !== undefined && (
                          <p className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Qualification Score: {meeting.qualificationScore}/100
                          </p>
                        )}
                        {meeting.aiInsights && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">AI Insights:</p>
                            <p className="text-xs text-blue-800 dark:text-blue-300">{meeting.aiInsights.recommendedAction}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No meetings found. Schedule your first meeting to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
