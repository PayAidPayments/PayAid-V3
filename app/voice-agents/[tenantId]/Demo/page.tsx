'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2, ArrowLeft, Volume2, Mic, MicOff, Phone, PhoneOff, Wifi, WifiOff, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useVoiceWebSocket } from '@/lib/hooks/useVoiceWebSocket'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function VoiceAgentDemoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const agentId = searchParams.get('agentId')
  const { token } = useAuthStore()
  
  const [agent, setAgent] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isInCall, setIsInCall] = useState(false) // For HTTP fallback mode
  const [useRealtime, setUseRealtime] = useState(true) // Toggle for real-time vs HTTP
  const [microphoneError, setMicrophoneError] = useState<string | null>(null)
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false)
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null)
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false)
  const diagnosticsTextRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null) // Store the microphone stream

  // WebSocket hook for real-time communication
  const {
    isConnected: wsConnected,
    isCallActive: wsCallActive,
    callId: wsCallId,
    error: wsError,
    connect: wsConnect,
    retry: wsRetry,
    startCall: wsStartCall,
    endCall: wsEndCall,
    sendAudio: wsSendAudio,
  } = useVoiceWebSocket({
    agentId: agentId || '',
    token: token || '',
    enabled: useRealtime && !!agentId && !!token,
    onTranscript: (text) => {
      setMessages((prev) => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        if (updated[lastIndex]?.content === '🎤 Recording...') {
          updated[lastIndex] = {
            role: 'user',
            content: text,
            timestamp: new Date(),
          }
        } else {
          updated.push({
            role: 'user',
            content: text,
            timestamp: new Date(),
          })
        }
        return updated
      })
    },
    onResponse: (text) => {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      }])
    },
    onAudioResponse: (audioBase64) => {
      const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
      const audioBlob = new Blob([audioData], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play().catch(err => console.error('Failed to play audio:', err))
      }
    },
    onCallStarted: (callId) => {
      setIsInCall(true)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '🎙️ Real-time voice call started. Speak naturally!',
        timestamp: new Date(),
      }])
    },
    onCallEnded: () => {
      setIsInCall(false)
      setIsRecording(false)
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current)
      }
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Voice call ended.',
        timestamp: new Date(),
      }])
    },
    onError: (error) => {
      console.error('[WebSocket] Error:', error)
      // Only show alert for persistent errors, not connection attempts
      if (wsCallActive) {
        alert(`WebSocket error: ${error}`)
      } else {
        // Just log for connection errors - they'll retry automatically
        console.warn('[WebSocket] Connection issue (will retry):', error)
      }
    },
  })

  useEffect(() => {
    if (agentId && token) {
      fetchAgent()
    } else if (!agentId) {
      setLoadingAgent(false)
    } else if (!token) {
      // If no token, still stop loading
      setLoadingAgent(false)
    }
  }, [agentId, token])
  
  // Safety timeout - stop loading after 10 seconds even if fetchAgent hasn't completed
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingAgent) {
        console.warn('[Demo] Loading timeout - stopping loading state')
        setLoadingAgent(false)
      }
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeout)
  }, [loadingAgent])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check microphone permissions on mount and periodically
  useEffect(() => {
    let mounted = true
    
    const checkMicrophonePermission = async () => {
      if (!mounted) return
      
      try {
        // NOTE: Permission API can be unreliable - it may report "denied" even when getUserMedia works
        // So we check it but don't fully trust it - we'll verify with actual getUserMedia when needed
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
            if (!mounted) return
            
            const permissionState = result.state as 'granted' | 'denied' | 'prompt'
            // Only set as initial hint - don't fully trust it
            // We'll verify with actual getUserMedia when user tries to use microphone
            setMicrophonePermission(permissionState)
            
            console.log('[Microphone] Permission API reports:', permissionState, '(this may be unreliable)')
            
            // Only proactively get stream if Permission API says "granted"
            // But note: even if it says "denied", getUserMedia might still work
            if (permissionState === 'granted' && !microphoneStreamRef.current) {
              console.log('[Microphone] Permission API says granted - proactively getting stream')
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                if (!mounted) {
                  stream.getTracks().forEach(track => track.stop())
                  return
                }
                
                microphoneStreamRef.current = stream
                setMicrophoneError(null)
                // Confirm permission is granted (getUserMedia succeeded)
                setMicrophonePermission('granted')
                stream.getAudioTracks().forEach(track => {
                  track.enabled = true
                })
                console.log('[Microphone] ✅ Stream obtained proactively - permission confirmed as GRANTED')
              } catch (error: any) {
                console.warn('[Microphone] Permission API said granted but getUserMedia failed:', error)
                // If Permission API says granted but getUserMedia fails, trust getUserMedia
                // Don't set error - user hasn't tried to use it yet, but update state
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                  setMicrophonePermission('denied')
                } else {
                  setMicrophonePermission('prompt')
                }
              }
            } else if (permissionState === 'denied') {
              // Permission API says denied, but it might be wrong
              // Don't block user - they can still try and getUserMedia might work
              console.log('[Microphone] ⚠️ Permission API says denied, but this may be incorrect - user can still try')
            }
            
            // Listen for permission changes
            result.onchange = async () => {
              if (!mounted) return
              try {
                const newState = result.state as 'granted' | 'denied' | 'prompt'
                console.log('[Microphone] Permission API reports change to:', newState)
                
                // Only update if we don't have an active stream
                // If we have a stream, permission is definitely granted regardless of API
                if (!microphoneStreamRef.current) {
                  setMicrophonePermission(newState)
                } else {
                  console.log('[Microphone] Ignoring Permission API change - we have active stream (permission is granted)')
                }
                
                if (newState === 'granted') {
                  setMicrophoneError(null)
                  
                  if (!microphoneStreamRef.current) {
                    // Proactively get stream when permission changes to granted
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                      if (!mounted) {
                        stream.getTracks().forEach(track => track.stop())
                        return
                      }
                      
                      microphoneStreamRef.current = stream
                      console.log('[Microphone] ✅ Stream obtained after permission change')
                      
                      // Enable the track immediately (like Google Meet)
                      const audioTrack = stream.getAudioTracks()[0]
                      if (audioTrack) {
                        audioTrack.enabled = true
                        console.log('[Microphone] ✅ Microphone enabled after permission change')
                      }
                      
                      // Automatically enable microphone after permission is granted
                      setTimeout(() => {
                        if (mounted) {
                          enableMicrophoneAfterPermission(false).catch(err => {
                            console.error('[Microphone] Failed to auto-enable after permission change:', err)
                          })
                        }
                      }, 500)
                    } catch (error) {
                      console.warn('[Microphone] Failed to get stream after permission change:', error)
                    }
                  } else {
                    // Stream already exists, enable it immediately
                    const audioTrack = microphoneStreamRef.current.getAudioTracks()[0]
                    if (audioTrack) {
                      audioTrack.enabled = true
                      console.log('[Microphone] ✅ Microphone enabled (stream already existed)')
                    }
                    
                    setTimeout(() => {
                      if (mounted) {
                        enableMicrophoneAfterPermission(false).catch(err => {
                          console.error('[Microphone] Failed to auto-enable after permission change:', err)
                        })
                      }
                    }, 500)
                  }
                } else if (newState === 'denied') {
                  // Stop stream if permission was denied
                  if (microphoneStreamRef.current) {
                    microphoneStreamRef.current.getTracks().forEach(track => track.stop())
                    microphoneStreamRef.current = null
                  }
                }
              } catch (error) {
                console.error('[Microphone] Error in permission change handler:', error)
              }
            }
          } catch (error) {
            // Permission API might not be supported, set to unknown
            if (mounted) {
              setMicrophonePermission('unknown')
              console.log('[Microphone] Permission API check failed:', error)
            }
          }
        } else {
          // Permission API not supported, set to unknown
          if (mounted) {
            setMicrophonePermission('unknown')
            console.log('[Microphone] Permission API not available')
          }
        }
      } catch (error) {
        console.error('[Microphone] Error in checkMicrophonePermission:', error)
        if (mounted) {
          setMicrophonePermission('unknown')
        }
      }
    }
    
    // Run check with a delay to not block page load
    const timeoutId = setTimeout(() => {
      if (mounted) {
        checkMicrophonePermission()
      }
    }, 500)
    
    // Re-check permission every 5 seconds (in case user changes it in browser settings)
    const interval = setInterval(() => {
      if (mounted) {
        checkMicrophonePermission()
      }
    }, 5000)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [])

  // Diagnostic function to check microphone access
  const diagnoseMicrophoneAccess = async () => {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      secureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasPermissionsAPI: !!(navigator.permissions && navigator.permissions.query),
      currentStream: !!microphoneStreamRef.current,
      streamActive: microphoneStreamRef.current?.active || false,
    }

    // Check permission state
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        diagnostics.permissionState = result.state
        diagnostics.permissionSupported = true
      } catch (e) {
        diagnostics.permissionState = 'unknown'
        diagnostics.permissionError = String(e)
      }
    } else {
      diagnostics.permissionState = 'unknown'
      diagnostics.permissionSupported = false
    }

    // Check available audio devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(d => d.kind === 'audioinput')
      diagnostics.audioDevices = audioDevices.length
      diagnostics.audioDeviceLabels = audioDevices.map(d => ({
        deviceId: d.deviceId,
        label: d.label || 'No label (permission required)',
        groupId: d.groupId
      }))
    } catch (e) {
      diagnostics.enumerateError = String(e)
    }

    console.log('[Microphone] 🔍 Diagnostic Information:', diagnostics)
    return diagnostics
  }

  // Function to get or create microphone stream (reuses existing stream if available)
  const getMicrophoneStream = async (retryCount = 0): Promise<MediaStream> => {
    // Run diagnostics first
    const diagnostics = await diagnoseMicrophoneAccess()
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || 
                            window.location.protocol === 'https:' || 
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname.includes('127.0.0.1')
    
    if (!isSecureContext) {
      const error = new Error('Microphone access requires a secure context (HTTPS). Please use HTTPS or localhost.')
      console.error('[Microphone] ❌ Not in secure context:', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isSecureContext: window.isSecureContext,
        diagnostics
      })
      throw error
    }
    
    // If we already have an active stream, reuse it
    if (microphoneStreamRef.current) {
      const stream = microphoneStreamRef.current
      // Check if stream is still active
      if (stream.active && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].readyState === 'live') {
        console.log('[Microphone] ✅ Reusing existing stream')
        return stream
      } else {
        // Stream is no longer active, clear it
        console.log('[Microphone] Existing stream is no longer active, clearing it')
        microphoneStreamRef.current = null
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.')
    }

    // Check actual permission state before requesting
    // NOTE: Permission API can be unreliable - it may say "denied" even when getUserMedia works
    // So we'll check it but not block if it says denied - we'll try getUserMedia anyway
    let actualPermissionState: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown'
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        actualPermissionState = result.state as 'granted' | 'denied' | 'prompt'
        console.log('[Microphone] Permission API reports:', actualPermissionState)
        
        // Don't block if it says "denied" - the Permission API can be wrong
        // We'll try getUserMedia anyway and see what actually happens
        if (actualPermissionState === 'denied') {
          console.warn('[Microphone] ⚠️ Permission API says "denied", but this may be incorrect.')
          console.warn('[Microphone] ⚠️ We\'ll try getUserMedia anyway - if it succeeds, permission is actually GRANTED.')
          console.warn('[Microphone] ⚠️ The Permission API can be unreliable, especially on Windows.')
        }
      } catch (permError) {
        console.warn('[Microphone] Could not check permission state:', permError)
        // Permission API not available - that's fine, we'll try getUserMedia
      }
    }

    try {
      console.log('[Microphone] Requesting microphone access...', {
        secureContext: isSecureContext,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        currentPermission: actualPermissionState,
        retryCount,
        diagnostics
      })
      
      // Try with minimal constraints first (more likely to work)
      let stream: MediaStream | null = null
      let lastError: any = null
      
      // Strategy 1: Try with minimal constraints
      try {
        console.log('[Microphone] Attempt 1: Minimal constraints')
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (error1: any) {
        lastError = error1
        console.warn('[Microphone] Attempt 1 failed:', error1.name, error1.message)
        
        // Strategy 2: Try with specific constraints
        if (error1.name === 'NotAllowedError' || error1.name === 'PermissionDeniedError') {
          // If permission denied, don't retry - it won't help
          throw error1
        }
        
        try {
          console.log('[Microphone] Attempt 2: With audio constraints')
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })
        } catch (error2: any) {
          lastError = error2
          console.warn('[Microphone] Attempt 2 failed:', error2.name, error2.message)
          
          // Strategy 3: Try with deviceId if available
          if (diagnostics.audioDevices > 0 && diagnostics.audioDeviceLabels[0]?.deviceId) {
            try {
              console.log('[Microphone] Attempt 3: With specific device')
              stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                  deviceId: { exact: diagnostics.audioDeviceLabels[0].deviceId }
                }
              })
            } catch (error3: any) {
              lastError = error3
              console.warn('[Microphone] Attempt 3 failed:', error3.name, error3.message)
            }
          }
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Failed to get microphone stream after all attempts')
      }
      
      console.log('[Microphone] ✅ Stream obtained successfully')
      console.log('[Microphone] Stream details:', {
        active: stream.active,
        audioTracks: stream.getAudioTracks().length,
        trackStates: stream.getAudioTracks().map(t => ({
          id: t.id,
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted,
          label: t.label
        }))
      })
      
      // Store the stream for reuse
      microphoneStreamRef.current = stream
      
      // IMPORTANT: If getUserMedia succeeds, permission is GRANTED regardless of what Permission API says
      // The Permission API can be unreliable and report "denied" even when access works
      setMicrophonePermission('granted')
      setMicrophoneError(null)
      
      console.log('[Microphone] ✅ Permission confirmed as GRANTED (getUserMedia succeeded)')
      
      // Note: We intentionally do NOT re-check Permission API here because:
      // 1. getUserMedia success = permission is granted (definitive)
      // 2. Permission API can be wrong and report "denied" even when access works
      // 3. We should trust the actual access result, not the API
      
      // Listen for stream end events
      stream.getAudioTracks().forEach(track => {
        console.log('[Microphone] Track details:', {
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label
        })
        
        track.onended = () => {
          console.log('[Microphone] Track ended')
          if (microphoneStreamRef.current === stream) {
            microphoneStreamRef.current = null
            setMicrophonePermission('prompt')
          }
        }
        
        track.onmute = () => {
          console.warn('[Microphone] Track muted')
        }
        
        track.onunmute = () => {
          console.log('[Microphone] Track unmuted')
        }
      })
      
      return stream
    } catch (error: any) {
      console.error('[Microphone] ❌ Failed to get microphone stream:', error)
      console.error('[Microphone] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        constraint: error.constraint,
        secureContext: isSecureContext,
        hasMediaDevices: !!navigator.mediaDevices,
        currentPermission: actualPermissionState
      })
      
      // Update permission state based on error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        // IMPORTANT: The Permission API can report "denied" even when user allows
        // So we need to verify the actual state by checking if we can enumerate devices
        let verifiedDenied = true
        
        try {
          // Try to enumerate devices - if this works, permission might actually be granted
          const devices = await navigator.mediaDevices.enumerateDevices()
          const audioDevices = devices.filter(d => d.kind === 'audioinput')
          
          // If we can see device labels, permission is actually granted
          if (audioDevices.length > 0 && audioDevices.some(d => d.label && d.label !== '')) {
            console.log('[Microphone] ⚠️ Permission API says denied, but we can see device labels - permission might actually be granted!')
            verifiedDenied = false
            
            // Try a simpler getUserMedia call without constraints
            try {
              console.log('[Microphone] 🔄 Retrying with minimal constraints...')
              const simpleStream = await navigator.mediaDevices.getUserMedia({ audio: true })
              console.log('[Microphone] ✅ Success! Permission is actually GRANTED - Permission API was wrong!')
              
              // Store the stream
              microphoneStreamRef.current = simpleStream
              // IMPORTANT: Set to granted - getUserMedia success = permission granted (definitive)
              setMicrophonePermission('granted')
              setMicrophoneError(null)
              
              // Enable the track
              simpleStream.getAudioTracks().forEach(track => {
                track.enabled = true
              })
              
              // Listen for stream end events
              simpleStream.getAudioTracks().forEach(track => {
                track.onended = () => {
                  console.log('[Microphone] Track ended')
                  if (microphoneStreamRef.current === simpleStream) {
                    microphoneStreamRef.current = null
                    setMicrophonePermission('prompt')
                  }
                }
              })
              
              return simpleStream
            } catch (retryError: any) {
              console.log('[Microphone] Retry also failed:', retryError.name)
              verifiedDenied = true
            }
          }
        } catch (enumError) {
          console.warn('[Microphone] Could not enumerate devices to verify:', enumError)
        }
        
        if (verifiedDenied) {
          setMicrophonePermission('denied')
        }
        
        // Re-check permission state to see if it actually changed
        let actualPermissionAfterError = 'unknown'
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
            actualPermissionAfterError = result.state
            console.log('[Microphone] Permission API state after error:', actualPermissionAfterError)
            console.log('[Microphone] ⚠️ Note: Permission API can be unreliable - actual access may differ')
          } catch (e) {
            console.warn('[Microphone] Could not check permission after error:', e)
          }
        }
        
        // Provide detailed troubleshooting with diagnostic info
        const troubleshooting = `
Microphone permission was denied. Diagnostic info:
- Permission State: ${actualPermissionAfterError}
- Secure Context: ${isSecureContext}
- Protocol: ${window.location.protocol}
- Hostname: ${window.location.hostname}
- Audio Devices Found: ${diagnostics.audioDevices || 0}

Please try these steps IN ORDER:

1. **Check Browser Site Settings:**
   - Click the lock/padlock icon in the address bar (left of URL)
   - Find "Microphone" in the list
   - Change it from "Block" or "Ask" to "Allow"
   - Click "Reload" button or refresh the page (F5)

2. **Windows Privacy Settings (REQUIRED on Windows):**
   - Press Windows key + I to open Settings
   - Go to Privacy & Security → Microphone
   - Toggle "Microphone access" to ON
   - Toggle "Let apps access your microphone" to ON
   - Scroll down to "Let desktop apps access your microphone"
   - Ensure it's ON
   - Find your browser (Chrome/Edge) in the list and ensure it's allowed
   - CLOSE AND RESTART your browser completely

3. **Clear Site Data and Permissions:**
   - Press F12 to open DevTools
   - Go to Application tab
   - Click "Clear site data" button
   - OR manually:
     - Click "Storage" → "Clear site data"
     - Click "Permissions" → Find "Microphone" → Click "Reset permissions"
   - Close DevTools and refresh the page (Ctrl+Shift+R for hard refresh)

4. **Check if Microphone is Working:**
   - Open Windows Settings → Privacy → Microphone
   - Click "Test your microphone" to verify it works
   - If test fails, check Windows Sound Settings

5. **Try Incognito/Private Mode:**
   - Open a new incognito/private window
   - Navigate to the site
   - Try again (this bypasses cached permissions)

6. **Try Different Browser:**
   - Chrome or Edge usually work best
   - Firefox also works well
   - Safari (Mac) may have different requirements

7. **Check for Conflicting Apps:**
   - Close ALL apps that might use microphone (Zoom, Teams, Discord, etc.)
   - Restart your browser
   - Try again

If still not working, check the browser console (F12) for detailed error messages.
        `.trim()
        
        console.error('[Microphone] ❌ Permission denied with diagnostics:', {
          error: error.name,
          message: error.message,
          diagnostics,
          actualPermissionAfterError,
          troubleshooting
        })
        
        // Create enhanced error with troubleshooting
        const enhancedError = new Error(`Permission denied. ${troubleshooting}`)
        enhancedError.name = error.name
        throw enhancedError
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found. Please connect a microphone to your device.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Microphone is already in use by another application. Please close it and try again.')
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        throw new Error('Microphone does not support the required settings. Please try a different microphone.')
      }
      
      // Re-throw the error so caller can handle it properly
      throw error
    }
  }

  // Function to automatically enable microphone after permission is granted
  // This mimics Google Meet behavior - microphone starts immediately after permission grant
  const enableMicrophoneAfterPermission = async (autoStartCall = false) => {
    try {
      console.log('[Microphone] 🔄 Auto-enabling microphone after permission grant...', { autoStartCall })
      
      // Ensure we have an active stream (this should already be set from getMicrophoneStream)
      if (!microphoneStreamRef.current) {
        console.log('[Microphone] Getting stream for auto-enable...')
        await getMicrophoneStream()
      }
      
      // If we have a stream, the microphone is now active
      if (microphoneStreamRef.current) {
        const stream = microphoneStreamRef.current
        const audioTrack = stream.getAudioTracks()[0]
        if (audioTrack) {
          // Enable the track (make sure it's not muted)
          audioTrack.enabled = true
          console.log('[Microphone] ✅ Microphone track enabled and active:', {
            enabled: audioTrack.enabled,
            muted: audioTrack.muted,
            readyState: audioTrack.readyState
          })
        }
      }
      
      // If autoStartCall is true, start the call and recording automatically
      if (autoStartCall) {
        console.log('[Microphone] 📞 Auto-starting call after permission grant...')
        
        // Start the call first
        await startVoiceCall()
        
        // Wait a bit for call to initialize, then start recording
        setTimeout(async () => {
          try {
            // Check if call is active
            const callActive = useRealtime ? wsCallActive : isInCall
            if (callActive && !isRecording) {
              console.log('[Microphone] 🎤 Auto-starting recording after call started...')
              await startRecording()
            }
          } catch (err) {
            console.error('[Microphone] Failed to auto-start recording:', err)
          }
        }, 500)
      } else {
        // If we're already in a call but not recording, automatically start recording
        const callActive = useRealtime ? wsCallActive : isInCall
        if (callActive && !isRecording) {
          console.log('[Microphone] 🎤 Auto-starting recording after permission grant...')
          setTimeout(async () => {
            try {
              await startRecording()
            } catch (err) {
              console.error('[Microphone] Failed to auto-start recording:', err)
            }
          }, 300)
        }
      }
    } catch (error) {
      console.error('[Microphone] Failed to auto-enable microphone:', error)
    }
  }

  // Function to explicitly request microphone permission (must be user-initiated)
  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true)
    setMicrophoneError(null)

    try {
      // Add a small delay to ensure this is truly user-initiated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Get microphone stream (this will trigger browser prompt)
      const stream = await getMicrophoneStream()
      
      // Permission granted and stream is ready
      setShowPermissionModal(false)
      
      // Re-check permission status using Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          const permissionState = result.state as 'granted' | 'denied' | 'prompt'
          setMicrophonePermission(permissionState)
          console.log('[Microphone] Permission state confirmed:', permissionState)
        } catch (e) {
          // Permissions API might not work, but we know getUserMedia succeeded
          console.log('Could not query permission status:', e)
        }
      }
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '✅ Microphone permission granted! Automatically enabling microphone...',
        timestamp: new Date(),
      }])
      
      // Automatically enable microphone after permission is granted
      // Pass true to auto-start call if not already in one (like Google Meet does)
      const shouldAutoStartCall = !isInCall && !wsCallActive
      await enableMicrophoneAfterPermission(shouldAutoStartCall)
      
      // If there was a pending action (like starting a call), execute it now
      if (pendingActionRef.current) {
        const action = pendingActionRef.current
        pendingActionRef.current = null
        // Execute after a brief delay to ensure state is updated
        setTimeout(() => {
          action()
        }, 200)
      }
    } catch (error: any) {
      console.error('[Microphone] Failed to request microphone permission:', error)
      
      // Use the error message from getMicrophoneStream which includes troubleshooting
      const errorMessage = error.message || 'Failed to access microphone.'
      setMicrophonePermission('denied')
      setMicrophoneError(errorMessage)
      setShowPermissionModal(false)
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `❌ ${errorMessage}`,
        timestamp: new Date(),
      }])
    } finally {
      setIsRequestingPermission(false)
    }
  }
  
  // Cleanup function to stop microphone stream
  const stopMicrophoneStream = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop())
      microphoneStreamRef.current = null
    }
  }

  // Store the pending action to execute after permission is granted
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null)
  
  // Show permission modal when user tries to start a call without permission
  const handleStartVoiceCallWithPermission = async () => {
    // Check permission status first
    if (microphonePermission !== 'granted') {
      // Try to check actual permission status
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          if (result.state === 'granted') {
            setMicrophonePermission('granted')
            await startVoiceCall()
            return
          }
        } catch (e) {
          // Permissions API not available, continue with automatic request
        }
      }
      
      // Automatically request permission instead of showing modal
      // This is a user-initiated action (button click), so we can request directly
      try {
        console.log('[Microphone] Automatically requesting permission for voice call...')
        const stream = await getMicrophoneStream()
        // Permission granted, proceed with call
        setMicrophonePermission('granted')
        setMicrophoneError(null)
        
        // Start the call
        await startVoiceCall()
        
        // Automatically enable microphone and start recording after call starts
        // The stream is already active from getMicrophoneStream(), so we just need to start recording
        setTimeout(async () => {
          try {
            console.log('[Microphone] 🎤 Auto-starting recording after call start...')
            const callActive = useRealtime ? wsCallActive : isInCall
            if (callActive && !isRecording && microphoneStreamRef.current) {
              await startRecording()
            }
          } catch (err) {
            console.error('[Microphone] Failed to auto-start recording after call:', err)
          }
        }, 500)
      } catch (error: any) {
        console.error('[Microphone] Failed to get permission:', error)
        // If automatic request fails, show modal with instructions
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setMicrophonePermission('denied')
          // Store the action to execute after permission is granted
          pendingActionRef.current = async () => {
            await startVoiceCall()
            // Auto-enable microphone after call starts
            setTimeout(async () => {
              await enableMicrophoneAfterPermission()
            }, 500)
          }
          setShowPermissionModal(true)
        } else {
          // Other errors - show error message
          setMicrophoneError(error.message || 'Failed to access microphone')
        }
      }
      return
    }
    await startVoiceCall()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAgent = async () => {
    if (!agentId || !token) {
      setLoadingAgent(false)
      return
    }

    try {
      console.log('[Demo] Fetching agent:', agentId)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      const response = await fetch(`/api/v1/voice-agents/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setAgent(data)
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm ${data.name}. ${data.description || 'How can I help you today?'}`,
          timestamp: new Date(),
        }])
      } else {
        console.error('[Demo] Failed to fetch agent - response not ok:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('[Demo] Error data:', errorData)
      }
    } catch (error: any) {
      console.error('[Demo] Failed to fetch agent:', error)
      if (error.name === 'AbortError') {
        console.error('[Demo] Request timed out')
      }
    } finally {
      setLoadingAgent(false)
      console.log('[Demo] Loading agent set to false')
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !agentId || !token) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Prepare conversation history (last 10 messages)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      const response = await fetch(`/api/v1/voice-agents/${agentId}/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.agentResponse,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to get response from agent')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = agent?.language === 'hi' ? 'hi-IN' : 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  const startVoiceCall = async () => {
    if (!agentId || !token) return

    if (useRealtime && wsConnected) {
      // Use WebSocket for real-time
      wsStartCall()
      return
    }

    // Fallback to HTTP API
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/voice-agents/${agentId}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: 'demo-call',
          language: agent?.language,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsInCall(true)
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Voice call started. Click the microphone to speak.',
          timestamp: new Date(),
        }])
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start call')
      }
    } catch (error) {
      console.error('Failed to start call:', error)
      alert('Failed to start call. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const endVoiceCall = async () => {
    if (useRealtime && wsCallActive) {
      wsEndCall()
    }

    setIsInCall(false)
    setIsRecording(false)
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    // Clear interval
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
    }
    
    // Note: We don't stop the microphone stream here - keep it alive for next use
    // Only stop it when component unmounts or user explicitly denies permission
    
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: 'Voice call ended.',
      timestamp: new Date(),
    }])
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophoneStream()
    }
  }, [])

  const startRecording = async () => {
    const activeCallId = useRealtime ? wsCallId : null
    const isActive = useRealtime ? wsCallActive : isInCall

    if (!isActive || !agentId || !token) {
      alert('Please start a voice call first')
      return
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.'
      setMicrophoneError(errorMsg)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `❌ ${errorMsg}`,
        timestamp: new Date(),
      }])
      return
    }

    // Clear any previous errors
    setMicrophoneError(null)

    try {
      // Automatically request permission if not granted (this is user-initiated via button click)
      if (microphonePermission !== 'granted') {
        console.log('[Microphone] Permission not granted, automatically requesting...')
        // This is a user-initiated action, so we can request permission directly
        try {
          const stream = await getMicrophoneStream()
          setMicrophonePermission('granted')
          setMicrophoneError(null)
          // Continue with recording setup below
        } catch (error: any) {
          // Permission request failed
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setMicrophonePermission('denied')
            setShowPermissionModal(true)
          }
          throw error // Re-throw to be caught by outer catch
        }
      }
      
      // Get or create microphone stream (reuses existing stream if available)
      const stream = await getMicrophoneStream()
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      if (useRealtime && wsConnected) {
        // Real-time: Stream audio chunks continuously
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && wsCallActive) {
            const arrayBuffer = await event.data.arrayBuffer()
            const base64Audio = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer))
            )
            wsSendAudio(base64Audio, agent?.language)
          }
        }

        // Start recording with timeslice for continuous streaming
        mediaRecorder.start(500) // Send chunks every 500ms for real-time
        setIsRecording(true)

        setMessages((prev) => [...prev, {
          role: 'user',
          content: '🎤 Recording (real-time)...',
          timestamp: new Date(),
        }])
      } else {
        // HTTP: Record and send on stop
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await processAudioChunk(audioBlob)
          // Note: We don't stop the stream tracks here - keep the stream alive for reuse
        }

        mediaRecorder.start()
        setIsRecording(true)

        setMessages((prev) => [...prev, {
          role: 'user',
          content: '🎤 Recording...',
          timestamp: new Date(),
        }])
      }

      mediaRecorderRef.current = mediaRecorder
      
      // Successfully started recording - permission is already granted
      setMicrophoneError(null)
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      
      // Update permission state based on error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicrophonePermission('denied')
      }
      
      let errorMessage = 'Failed to access microphone. '
      let instructions = ''

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. '
        instructions = 'Please follow these steps IN ORDER:\n\n' +
          '1. Browser Settings:\n' +
          '   • Chrome/Edge: Click the lock icon in address bar → Site settings → Microphone → Allow\n' +
          '   • Firefox: Click the lock icon → Permissions → Microphone → Allow\n\n' +
          '2. Windows Privacy Settings (REQUIRED on Windows):\n' +
          '   • Press Windows key + I → Privacy & Security → Microphone\n' +
          '   • Turn ON "Microphone access"\n' +
          '   • Turn ON "Let apps access your microphone"\n' +
          '   • Turn ON "Let desktop apps access your microphone"\n' +
          '   • Find your browser in the list and ensure it\'s allowed\n' +
          '   • CLOSE AND RESTART your browser completely (this is critical!)\n\n' +
          '3. Clear Site Data:\n' +
          '   • Press F12 → Application tab → Clear site data → Refresh (Ctrl+Shift+R)\n\n' +
          '4. Try Incognito Mode if still not working.\n\n' +
          'After changing Windows settings, you MUST restart your browser for changes to take effect.'
        
        // Show permission modal again
        setShowPermissionModal(true)
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. '
        instructions = 'Please connect a microphone to your device and try again.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Microphone is already in use. '
        instructions = 'Another application is using your microphone. Please close it and try again.'
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Microphone constraints not supported. '
        instructions = 'Your microphone does not support the required settings. Please try a different microphone.'
      } else {
        instructions = 'Please check your browser settings and ensure your microphone is connected and working.'
      }

      const fullError = errorMessage + instructions
      setMicrophoneError(fullError)
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `❌ ${fullError}`,
        timestamp: new Date(),
      }])
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Note: We don't stop the stream tracks here - keep the stream alive for reuse
      // The stream is stored in microphoneStreamRef and will be reused for next recording
    }
  }

  const processAudioChunk = async (audioBlob: Blob) => {
    // This is only used for HTTP fallback mode
    if (!agentId || !token) return

    try {
      setLoading(true)
      
      // Create call first if not exists
      const callResponse = await fetch(`/api/v1/voice-agents/${agentId}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: 'demo-call',
          language: agent?.language,
        }),
      })

      if (!callResponse.ok) {
        throw new Error('Failed to create call')
      }

      const callData = await callResponse.json()
      const callId = callData.callId

      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      )

      // Process audio chunk
      const response = await fetch(
        `/api/v1/voice-agents/${agentId}/calls/${callId}/process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            audioData: base64Audio,
            language: agent?.language,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Update user message with transcript
        setMessages((prev) => {
          const updated = [...prev]
          const lastUserIndex = updated.length - 1
          if (updated[lastUserIndex]?.content === '🎤 Recording...') {
            updated[lastUserIndex] = {
              role: 'user',
              content: data.transcript || 'Audio processed',
              timestamp: new Date(),
            }
          }
          return updated
        })

        // Add assistant response
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.response || 'Response received',
          timestamp: new Date(),
        }])

        // Play audio response if available
        if (data.audio) {
          const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))
          const audioBlob = new Blob([audioData], { type: 'audio/wav' })
          const audioUrl = URL.createObjectURL(audioBlob)
          
          if (audioRef.current) {
            audioRef.current.src = audioUrl
            audioRef.current.play().catch(err => console.error('Failed to play audio:', err))
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process audio')
      }
    } catch (error) {
      console.error('Failed to process audio:', error)
      alert('Failed to process audio. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingAgent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading agent...</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.warn('[Demo] User cancelled loading')
            setLoadingAgent(false)
          }}
        >
          Cancel Loading
        </Button>
      </div>
    )
  }

  if (!agentId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No agent selected for demo</p>
            <Link href={`/voice-agents/${tenantId}/Home`}>
              <Button>Go to Voice Agents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Agent not found</p>
            <Link href={`/voice-agents/${tenantId}/Home`}>
              <Button>Go to Voice Agents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/voice-agents/${tenantId}/Home`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{agent.name} - Demo</h1>
              <p className="text-sm text-muted-foreground">
                Test how the voice agent responds to messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{agent.language.toUpperCase()}</Badge>
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
              {agent.status}
            </Badge>
            {useRealtime && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={wsConnected ? 'default' : 'destructive'} 
                  className="flex items-center gap-1"
                  title={wsConnected ? 'WebSocket connected' : wsError || 'WebSocket disconnected - check if server is running on port 3001'}
                >
                  {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {wsConnected ? 'Real-time' : 'Offline'}
                </Badge>
                {!wsConnected && agentId && token && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log('[Demo] Manual retry attempt', { agentId, hasToken: !!token })
                      wsRetry() // Use retry() to reset permanent failure flag
                    }}
                    className="h-6 text-xs px-2"
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-3xl space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 text-xs"
                    onClick={() => handleSpeak(message.content)}
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Speak
                  </Button>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto max-w-3xl">
          {/* Real-time Toggle */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useRealtime}
                onChange={(e) => setUseRealtime(e.target.checked)}
                className="rounded"
              />
              <span>Real-time WebSocket (requires WebSocket server)</span>
            </label>
          </div>

          {/* Voice Call Controls */}
          <div className="flex gap-2 mb-3 justify-center">
            {(!isInCall && !wsCallActive) ? (
              <Button
                onClick={handleStartVoiceCallWithPermission}
                disabled={loading || (useRealtime && !wsConnected)}
                variant="default"
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                {useRealtime ? 'Start Real-time Call' : 'Start Voice Call'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                  variant={isRecording ? "destructive" : "default"}
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      {useRealtime ? 'Stop Streaming' : 'Stop Recording'}
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      {useRealtime ? 'Start Streaming' : 'Start Recording'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={endVoiceCall}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              </>
            )}
          </div>

          {/* Microphone Error Banner */}
          {microphoneError && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <MicOff className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                    {microphoneError}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {microphonePermission !== 'granted' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={requestMicrophonePermission}
                          disabled={isRequestingPermission}
                        >
                          {isRequestingPermission ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3 mr-1" />
                              Request Permission
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={async () => {
                            const diagnostics = await diagnoseMicrophoneAccess()
                            console.log('[Microphone] Full Diagnostics:', diagnostics)
                            setDiagnosticsData(diagnostics)
                            setShowDiagnosticsModal(true)
                          }}
                        >
                          🔍 Run Diagnostics
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={async () => {
                            // Clear site data and reset permissions
                            try {
                              // Clear all site data
                              if ('storage' in navigator && 'estimate' in navigator.storage) {
                                const estimate = await navigator.storage.estimate()
                                console.log('[Microphone] Storage before clear:', estimate)
                              }
                              
                              // Try to clear permissions via IndexedDB (if possible)
                              if ('indexedDB' in window) {
                                indexedDB.databases().then(databases => {
                                  databases.forEach(db => {
                                    if (db.name) {
                                      indexedDB.deleteDatabase(db.name)
                                    }
                                  })
                                }).catch(err => console.warn('Could not clear IndexedDB:', err))
                              }
                              
                              // Clear localStorage and sessionStorage
                              localStorage.clear()
                              sessionStorage.clear()
                              
                              console.log('[Microphone] Site data cleared, reloading...')
                              
                              // Reload after a brief delay
                              setTimeout(() => {
                                window.location.reload()
                              }, 500)
                            } catch (err) {
                              console.error('Failed to clear site data:', err)
                              // Fallback: just reload
                              window.location.reload()
                            }
                          }}
                        >
                          🔄 Clear Data & Retry
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setMicrophoneError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Input */}
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isInCall ? "Or type a message..." : "Type your message to test the agent..."}
              disabled={loading || isInCall}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim() || isInCall}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {useRealtime && wsCallActive
              ? "🎙️ Real-time call active - Speak naturally, audio streams continuously"
              : isInCall
              ? "🎤 Voice call active - Click 'Start Recording' to speak to the agent"
              : useRealtime && !wsConnected
              ? "⚠️ WebSocket server not connected. Start the server: npm run dev:websocket"
              : "Start a voice call to test the agent's voice capabilities, or type a message for text testing"}
          </p>
        </div>
      </div>

      {/* Hidden audio element for playing responses */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Microphone Permission Modal */}
      <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Mic className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              Microphone Access Required
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              To use voice features, we need access to your microphone. Your browser will ask for permission.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={requestMicrophonePermission}
              disabled={isRequestingPermission}
              variant="default"
              className="w-full flex items-center justify-center gap-2 h-11"
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Requesting Permission...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Allow Microphone Access
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setShowPermissionModal(false)
                setMicrophoneError('Microphone permission is required to use voice features.')
              }}
              disabled={isRequestingPermission}
              variant="outline"
              className="w-full h-11"
            >
              Not Now
            </Button>
            {microphonePermission === 'denied' && (
              <>
                <Button
                  onClick={() => {
                    // Force refresh to clear cached permission state
                    window.location.reload()
                  }}
                  disabled={isRequestingPermission}
                  variant="outline"
                  className="w-full h-11 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  🔄 Refresh Page & Retry
                </Button>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ Permission Denied - Follow These Steps:
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-2 list-decimal list-inside">
                    <li>
                      <strong>Browser Settings:</strong> Click the lock icon in address bar → Microphone → Allow
                    </li>
                    <li>
                      <strong>Windows Privacy (REQUIRED):</strong> Press Win+I → Privacy & Security → Microphone → Turn ON all toggles → Find your browser and ensure it's allowed → <strong>RESTART browser completely</strong>
                    </li>
                    <li>
                      <strong>Clear Site Data:</strong> Press F12 → Application tab → Clear site data → Refresh page (Ctrl+Shift+R)
                    </li>
                    <li>
                      <strong>Try Incognito Mode:</strong> Open a new incognito/private window and try again
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            {microphonePermission === 'denied' 
              ? 'After changing Windows settings, you MUST close and restart your browser completely for changes to take effect.'
              : 'You can change this later in your browser settings'}
          </p>
        </DialogContent>
      </Dialog>

      {/* Diagnostics Modal */}
      <Dialog open={showDiagnosticsModal} onOpenChange={setShowDiagnosticsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔍 Microphone Diagnostics
            </DialogTitle>
            <DialogDescription>
              Diagnostic information to help troubleshoot microphone access issues
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {diagnosticsData && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Diagnostic Information (JSON)</label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={async () => {
                        const text = JSON.stringify(diagnosticsData, null, 2)
                        try {
                          await navigator.clipboard.writeText(text)
                          setDiagnosticsCopied(true)
                          setTimeout(() => setDiagnosticsCopied(false), 2000)
                        } catch (err) {
                          // Fallback: select text in textarea
                          if (diagnosticsTextRef.current) {
                            diagnosticsTextRef.current.select()
                            document.execCommand('copy')
                            setDiagnosticsCopied(true)
                            setTimeout(() => setDiagnosticsCopied(false), 2000)
                          }
                        }
                      }}
                    >
                      {diagnosticsCopied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <textarea
                    ref={diagnosticsTextRef}
                    readOnly
                    className="w-full h-64 p-3 text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md resize-none"
                    value={JSON.stringify(diagnosticsData, null, 2)}
                    onClick={(e) => {
                      (e.target as HTMLTextAreaElement).select()
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Summary</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Secure Context:</span>
                      <span className={diagnosticsData.secureContext ? 'text-green-600' : 'text-red-600'}>
                        {diagnosticsData.secureContext ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
                      <span>{diagnosticsData.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Hostname:</span>
                      <span>{diagnosticsData.hostname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Permission State:</span>
                      <span className={
                        diagnosticsData.permissionState === 'granted' ? 'text-green-600' :
                        diagnosticsData.permissionState === 'denied' ? 'text-red-600' :
                        'text-yellow-600'
                      }>
                        {diagnosticsData.permissionState || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Audio Devices Found:</span>
                      <span>{diagnosticsData.audioDevices || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Has MediaDevices API:</span>
                      <span>{diagnosticsData.hasMediaDevices ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Has Permissions API:</span>
                      <span>{diagnosticsData.hasPermissionsAPI ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Stream:</span>
                      <span>{diagnosticsData.currentStream ? '✅ Active' : '❌ None'}</span>
                    </div>
                  </div>
                </div>

                {diagnosticsData.audioDeviceLabels && diagnosticsData.audioDeviceLabels.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Audio Devices</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md space-y-2 text-sm">
                      {diagnosticsData.audioDeviceLabels.map((device: any, index: number) => (
                        <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <div className="font-medium">{device.label || `Device ${index + 1}`}</div>
                          {device.deviceId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ID: {device.deviceId.substring(0, 20)}...
                            </div>
                          )}
                          {device.label === "No label (permission required)" && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              ⚠️ Permission required to see device name
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diagnosticsData.permissionState === 'denied' && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
                      <div className="flex-1">
                        <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Permission is Denied
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                          <p>Your browser has denied microphone access. To fix this:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>
                              <strong>Chrome/Edge:</strong> Click the lock icon (🔒) in the address bar → 
                              Find "Microphone" → Change to "Allow" → Refresh page
                            </li>
                            <li>
                              <strong>Windows Settings:</strong> Press Windows + I → Privacy → Microphone → 
                              Ensure all toggles are ON → Restart browser
                            </li>
                            <li>
                              <strong>Clear Site Data:</strong> Press F12 → Application tab → 
                              "Clear site data" button → Refresh page
                            </li>
                            <li>
                              <strong>Try Incognito Mode:</strong> Open a new incognito/private window and try again
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => setShowDiagnosticsModal(false)}
              variant="default"
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={async () => {
                const diagnostics = await diagnoseMicrophoneAccess()
                setDiagnosticsData(diagnostics)
              }}
              variant="outline"
              className="flex-1"
            >
              Refresh Diagnostics
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

