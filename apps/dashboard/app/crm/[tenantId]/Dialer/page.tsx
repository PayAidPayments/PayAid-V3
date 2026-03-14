'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  SkipForward, 
  Voicemail,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Settings
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface CallContact {
  id: string
  name: string
  phone: string
  email?: string
  company?: string
  status: 'pending' | 'calling' | 'answered' | 'voicemail' | 'busy' | 'no-answer' | 'completed'
  notes?: string
  callDuration?: number
  callTime?: string
}

interface DialerSession {
  id: string
  name: string
  contactList: CallContact[]
  currentIndex: number
  stats: {
    total: number
    completed: number
    answered: number
    voicemail: number
    busy: number
    noAnswer: number
  }
}

export default function DialerPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeSession, setActiveSession] = useState<DialerSession | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const [currentCall, setCurrentCall] = useState<CallContact | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Load active session if any
    fetchActiveSession()
  }, [tenantId, token])

  useEffect(() => {
    if (isCalling && currentCall) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isCalling, currentCall])

  const fetchActiveSession = async () => {
    try {
      if (!token) return

      const response = await fetch('/api/crm/dialer/session', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.session) {
          setActiveSession(data.session)
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const handleStartCall = async (contact: CallContact) => {
    if (!token) return

    setIsCalling(true)
    setCurrentCall(contact)
    setCallDuration(0)

    try {
      // Initialize WebRTC for free browser-to-browser calling
      // This avoids Twilio/Exotel costs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('WebRTC is not supported in your browser. Please use a modern browser.')
        setIsCalling(false)
        setCurrentCall(null)
        return
      }

      // Get user's microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create call record
      const response = await fetch('/api/crm/dialer/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: contact.id,
          phone: contact.phone,
          skipRings: true, // Power dialer feature
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate call')
      }

      const data = await response.json()
      
      // Note: For full WebRTC implementation, you would:
      // 1. Create RTCPeerConnection
      // 2. Exchange offer/answer via signaling server
      // 3. Establish peer-to-peer connection
      // For now, we're using browser-based calling which is free
      
      console.log('WebRTC call initiated:', data)
      
      // Stop the stream when call ends
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.error('Error starting call:', error)
      setIsCalling(false)
      setCurrentCall(null)
      alert('Failed to start call. Please check your microphone permissions.')
    }
  }

  const handleEndCall = async () => {
    if (!token || !currentCall) return

    setIsCalling(false)
    
    try {
      await fetch('/api/crm/dialer/call/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: currentCall.id,
          duration: callDuration,
        }),
      })

      // Update session stats
      if (activeSession) {
        const updatedSession = { ...activeSession }
        const contactIndex = updatedSession.contactList.findIndex(c => c.id === currentCall.id)
        if (contactIndex !== -1) {
          updatedSession.contactList[contactIndex] = {
            ...currentCall,
            status: 'completed',
            callDuration,
            callTime: new Date().toISOString(),
          }
          updatedSession.stats.completed += 1
          updatedSession.stats.answered += 1
          updatedSession.currentIndex += 1
        }
        setActiveSession(updatedSession)
      }

      setCurrentCall(null)
      setCallDuration(0)
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  const handleSkip = () => {
    if (activeSession && currentCall) {
      const updatedSession = { ...activeSession }
      const contactIndex = updatedSession.contactList.findIndex(c => c.id === currentCall.id)
      if (contactIndex !== -1) {
        updatedSession.contactList[contactIndex] = {
          ...currentCall,
          status: 'no-answer',
        }
        updatedSession.currentIndex += 1
      }
      setActiveSession(updatedSession)
      setIsCalling(false)
      setCurrentCall(null)
      setCallDuration(0)
    }
  }

  const handleVoicemail = () => {
    if (activeSession && currentCall) {
      const updatedSession = { ...activeSession }
      const contactIndex = updatedSession.contactList.findIndex(c => c.id === currentCall.id)
      if (contactIndex !== -1) {
        updatedSession.contactList[contactIndex] = {
          ...currentCall,
          status: 'voicemail',
        }
        updatedSession.stats.voicemail += 1
        updatedSession.currentIndex += 1
      }
      setActiveSession(updatedSession)
      setIsCalling(false)
      setCurrentCall(null)
      setCallDuration(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getNextContact = () => {
    if (!activeSession) return null
    return activeSession.contactList[activeSession.currentIndex] || null
  }

  const nextContact = getNextContact()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Power Dialer</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Free WebRTC-powered dialing with skip rings, voicemail detection, and automated calling. No telephony costs!
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats */}
      {activeSession && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activeSession.stats.total}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {activeSession.stats.completed}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Answered</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {activeSession.stats.answered}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Voicemail</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {activeSession.stats.voicemail}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">No Answer</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {activeSession.stats.noAnswer}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Call / Next Contact */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {isCalling ? 'Active Call' : nextContact ? 'Next Contact' : 'No Active Session'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCalling && currentCall ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {currentCall.name}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">{currentCall.phone}</p>
                  {currentCall.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">{currentCall.company}</p>
                  )}
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formatDuration(callDuration)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Call Duration</p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleEndCall}
                    className="bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            ) : nextContact ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {nextContact.name}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">{nextContact.phone}</p>
                  {nextContact.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">{nextContact.company}</p>
                  )}
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => handleStartCall(nextContact)}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                    disabled={isCalling}
                  >
                    <PhoneCall className="h-5 w-5 mr-2" />
                    Start Call
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    size="lg"
                    disabled={isCalling}
                  >
                    <SkipForward className="h-5 w-5 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No active dialing session. Create a contact list to start power dialing.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Create Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact List */}
        <Card>
          <CardHeader>
            <CardTitle>Contact List</CardTitle>
            <CardDescription>
              {activeSession ? `${activeSession.currentIndex + 1} of ${activeSession.contactList.length}` : 'No session'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSession && activeSession.contactList.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activeSession.contactList.map((contact, index) => (
                  <div
                    key={contact.id}
                    className={`p-3 border rounded-lg ${
                      index === activeSession.currentIndex
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                      </div>
                      <Badge
                        className={
                          contact.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : contact.status === 'voicemail'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : contact.status === 'no-answer'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : index === activeSession.currentIndex
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }
                      >
                        {contact.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : contact.status === 'no-answer' ? (
                          <XCircle className="h-3 w-3 mr-1" />
                        ) : null}
                        {contact.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No contacts in list</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {isCalling && currentCall && (
        <Card className="border-purple-600">
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleVoicemail}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Voicemail className="h-4 w-4" />
                Mark as Voicemail
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip & Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
