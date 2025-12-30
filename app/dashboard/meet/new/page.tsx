'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Users, Share2, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function MeetPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [meetingCode, setMeetingCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStartInstant = async () => {
    setIsJoining(true)
    try {
      const response = await fetch('/api/meet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Instant Meeting',
          isInstant: true,
        }),
      })
      if (response.ok) {
        const meeting = await response.json()
        router.push(`/dashboard/meet/${meeting.id}`)
      }
    } catch (error) {
      console.error('Error starting meeting:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleJoin = () => {
    if (meetingCode) {
      router.push(`/dashboard/meet/join/${meetingCode}`)
    }
  }

  const copyMeetingCode = () => {
    if (meetingCode) {
      navigator.clipboard.writeText(meetingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PayAid Meet</h1>
        <p className="text-gray-600 mt-1">HD video conferencing with screen sharing and recording</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Instant Meeting */}
        <div className="p-6 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Video className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Start Instant Meeting</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Start a meeting right now. Share the link with participants to join.
          </p>
          <button
            onClick={handleStartInstant}
            disabled={isJoining}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isJoining ? 'Starting...' : 'Start Meeting'}
          </button>
        </div>

        {/* Join Meeting */}
        <div className="p-6 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Join Meeting</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Enter a meeting code to join an existing meeting.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
              placeholder="Enter meeting code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              maxLength={8}
            />
            <button
              onClick={handleJoin}
              disabled={!meetingCode || meetingCode.length < 8}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

