'use client'

import { useState, useEffect } from 'react'
import { Video, Plus, Calendar, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function MeetPage() {
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      loadMeetings()
    }
  }, [token])

  const loadMeetings = async () => {
    if (!token) return
    try {
      const response = await fetch('/api/meet?status=scheduled', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUpcomingMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error('Error loading meetings:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PayAid Meet</h1>
          <p className="text-gray-600 mt-1">HD video conferencing with screen sharing, recording, and collaboration</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-5 w-5" />
            Schedule Meeting
          </button>
          <Link
            href="/dashboard/meet/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Video className="h-5 w-5" />
            New Meeting
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/meet/new"
          className="p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <Video className="h-8 w-8 text-blue-600 mb-2" />
          <div className="font-medium text-gray-900">Start Instant Meeting</div>
          <div className="text-sm text-gray-600 mt-1">Start a meeting right now</div>
        </Link>
        <button className="p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
          <Calendar className="h-8 w-8 text-blue-600 mb-2" />
          <div className="font-medium text-gray-900">Schedule Meeting</div>
          <div className="text-sm text-gray-600 mt-1">Plan a meeting for later</div>
        </button>
        <Link
          href="/dashboard/meet/new"
          className="p-6 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <Users className="h-8 w-8 text-blue-600 mb-2" />
          <div className="font-medium text-gray-900">Join Meeting</div>
          <div className="text-sm text-gray-600 mt-1">Enter a meeting code</div>
        </Link>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
        {upcomingMeetings.length === 0 ? (
          <div className="text-center text-gray-500 py-12 border border-gray-200 rounded-lg">
            <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No upcoming meetings scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{meeting.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(meeting.startTime).toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/meet/${meeting.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

