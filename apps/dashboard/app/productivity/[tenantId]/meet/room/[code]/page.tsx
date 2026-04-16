'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { ArrowLeft, Video, Copy } from 'lucide-react'
import Link from 'next/link'
import { PageLoading } from '@/components/ui/loading'
import { CopyAction } from '@/components/ui/copy-action'

const MEET_BASE_URL = process.env.NEXT_PUBLIC_MEET_BASE_URL || ''

export default function MeetRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const tenantId = params.tenantId as string
  const code = (params.code as string)?.toUpperCase() || ''
  const [meeting, setMeeting] = useState<{
    id: string
    title: string
    meetingCode: string
    status: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timeoutId = globalThis.setTimeout(() => {
      if (!code || !token) {
        setLoading(false)
        if (!token) setError('Sign in to join')
        return
      }
      fetch(`/api/meet/by-code/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Meeting not found')
          return res.json()
        })
        .then((data) => {
          if (!cancelled) setMeeting(data)
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load meeting')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      globalThis.clearTimeout(timeoutId)
    }
  }, [code, token])

  const joinUrl =
    MEET_BASE_URL && meeting
      ? `${MEET_BASE_URL.replace(/\/$/, '')}/payaid-${tenantId}-${meeting.meetingCode}?token=${encodeURIComponent(token || '')}`
      : ''

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/productivity/${tenantId}/meet/room/${meeting?.meetingCode || code}`
      : ''

  if (loading) {
    return <PageLoading message="Loading meeting..." fullScreen={false} />
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400 font-medium">{error || 'Meeting not found'}</p>
        <Link
          href={`/productivity/${tenantId}/meet`}
          className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Meet
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/productivity/${tenantId}/meet`}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            title="Leave and go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{meeting.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Code: {meeting.meetingCode}</p>
          </div>
        </div>
        <CopyAction
          textToCopy={inviteLink}
          successMessage="Invite link copied to clipboard."
          label="Copy invite link"
          copiedLabel="Copied"
          icon={<Copy className="h-4 w-4" />}
          buttonProps={{
            variant: 'ghost',
            size: 'sm',
            className: 'text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
          }}
          showFeedback={false}
        />
      </div>

      {MEET_BASE_URL && joinUrl ? (
        <iframe
          src={joinUrl}
          className="flex-1 w-full min-h-0 border-none"
          title="Video meeting"
          allow="microphone; camera; display-capture; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/50">
          <Video className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Video meeting</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Set <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">NEXT_PUBLIC_MEET_BASE_URL</code> in your environment to enable video (e.g. Jitsi). Share the invite link for others to join.
          </p>
          <p className="text-xs text-slate-500 mt-4 font-mono">Invite: {inviteLink}</p>
        </div>
      )}
    </div>
  )
}
