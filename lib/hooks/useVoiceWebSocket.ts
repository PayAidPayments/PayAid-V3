/**
 * React Hook for Real-time Voice WebSocket Communication
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface VoiceWebSocketMessage {
  type: 'audio' | 'text' | 'ping' | 'pong' | 'error' | 'transcript' | 'response' | 'audio_response' | 'connected' | 'call_started' | 'call_ended'
  data?: any
  agentId?: string
  callId?: string
  message?: string
}

export interface UseVoiceWebSocketOptions {
  agentId: string
  token: string
  enabled?: boolean
  onTranscript?: (text: string) => void
  onResponse?: (text: string) => void
  onAudioResponse?: (audioBase64: string) => void
  onError?: (error: string) => void
  onCallStarted?: (callId: string) => void
  onCallEnded?: () => void
}

export function useVoiceWebSocket(options: UseVoiceWebSocketOptions) {
  const {
    agentId,
    token,
    enabled = true,
    onTranscript,
    onResponse,
    onAudioResponse,
    onError,
    onCallStarted,
    onCallEnded,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3 // Maximum retry attempts
  const hasFailedPermanentlyRef = useRef<boolean>(false) // Flag to prevent infinite reconnection
  const isConnectingRef = useRef<boolean>(false) // Flag to prevent multiple simultaneous connections

  const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'

  const connect = useCallback(() => {
    // Prevent reconnection if we've permanently failed (code 1006/1008)
    if (hasFailedPermanentlyRef.current) {
      console.log('[WebSocket] Connection permanently failed - not retrying. Use retry() to try again.')
      return
    }
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('[WebSocket] Connection attempt already in progress')
      return
    }
    
    if (!enabled) {
      console.log('[WebSocket] Connection disabled')
      setError(null)
      setIsConnected(false)
      return
    }
    if (!agentId || !token) {
      const missing = []
      if (!agentId) missing.push('agentId')
      if (!token) missing.push('token')
      const errorMsg = `Missing required params: ${missing.join(', ')}`
      console.warn('[WebSocket]', errorMsg)
      setError(errorMsg)
      setIsConnected(false)
      return
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected')
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    isConnectingRef.current = true

    const wsUrl = `${WEBSOCKET_URL}?token=${token}&agentId=${agentId}`
    console.log(`[WebSocket] Attempting to connect to ${WEBSOCKET_URL}`)
    console.log(`[WebSocket] Full URL length: ${wsUrl.length} characters`)
    console.log(`[WebSocket] Token length: ${token.length} characters`)
    console.log(`[WebSocket] AgentId: ${agentId}`)
    
    try {
      const ws = new WebSocket(wsUrl)
      
      // Track connection state changes
      let connectionState = 'CONNECTING'
      console.log('[WebSocket] WebSocket object created, state:', ws.readyState)
      
      // Add a timeout to detect if connection hangs
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error('[WebSocket] Connection timeout after 10 seconds')
          ws.close()
          setError('Connection timeout - server may not be responding')
        }
      }, 10000)
      
      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        connectionState = 'OPEN'
        isConnectingRef.current = false
        hasFailedPermanentlyRef.current = false // Reset permanent failure flag on successful connection
        console.log('[WebSocket] ✅ Connected successfully to', WEBSOCKET_URL)
        console.log('[WebSocket] ReadyState:', ws.readyState, '(OPEN = 1)')
        setIsConnected(true)
        setError(null) // Clear any previous errors
        retryCountRef.current = 0 // Reset retry count on successful connection
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Ping every 30 seconds
      }

      ws.onmessage = (event) => {
        try {
          const message: VoiceWebSocketMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'connected':
              console.log('[WebSocket] Server ready')
              break

            case 'call_started':
              setCallId(message.callId || null)
              setIsCallActive(true)
              onCallStarted?.(message.callId || '')
              break

            case 'call_ended':
              setIsCallActive(false)
              setCallId(null)
              onCallEnded?.()
              break

            case 'transcript':
              onTranscript?.(message.data)
              break

            case 'response':
              onResponse?.(message.data)
              break

            case 'audio_response':
              onAudioResponse?.(message.data)
              break

            case 'error':
              onError?.(message.data || 'Unknown error')
              break

            case 'pong':
              // Heartbeat response
              break

            default:
              console.log('[WebSocket] Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        // WebSocket error events don't provide much info, but check if we can get details
        const wsState = ws.readyState
        // Only log if WebSocket is not already closed/closing (to avoid noise)
        if (wsState !== WebSocket.CLOSED && wsState !== WebSocket.CLOSING) {
          // Check if it's a connection refused error
          if (error instanceof ErrorEvent && error.message) {
            if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to connect')) {
              console.warn('[WebSocket] Connection refused - server may not be running. Start with: npm run dev:websocket')
            } else {
              console.warn('[WebSocket] Connection error:', error.message)
            }
          } else {
            // Generic error - only log if enabled and we're actually trying to connect
            if (enabled) {
              console.warn('[WebSocket] Connection error occurred (check onclose for details)')
            }
          }
        }
        // Don't call onError here - let onclose handle it
        // This prevents showing alerts during normal connection attempts
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        isConnectingRef.current = false
        console.log('[WebSocket] Disconnected')
        console.log('[WebSocket] Close code:', event.code)
        console.log('[WebSocket] Close reason:', event.reason || '(no reason provided)')
        console.log('[WebSocket] Was clean:', event.wasClean)
        console.log('[WebSocket] Connection state before close:', connectionState)
        setIsConnected(false)
        setIsCallActive(false)
        
        // Clear intervals
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }

        // Handle connection errors
        if (event.code === 1006) {
          // Abnormal closure - could be auth failure, network issue, or server error
          const errorMsg = event.reason || `WebSocket connection failed (code ${event.code}). Check server logs and ensure JWT_SECRET matches.`
          console.warn('[WebSocket] Connection closed abnormally:', errorMsg, 'Code:', event.code)
          setError(errorMsg)
          if (enabled) {
            onError?.(errorMsg)
          }
        } else if (event.code === 1002) {
          // Protocol error
          const errorMsg = `WebSocket protocol error (code ${event.code}): ${event.reason || 'Invalid protocol'}`
          console.warn('[WebSocket]', errorMsg)
          setError(errorMsg)
          if (enabled) {
            onError?.(errorMsg)
          }
        } else if (event.code === 1008) {
          // Policy violation - usually authentication failure
          const errorMsg = `Authentication failed: ${event.reason || 'Invalid token. Check JWT_SECRET matches between Next.js and WebSocket server.'}`
          console.warn('[WebSocket]', errorMsg, 'Code:', event.code)
          setError(errorMsg)
          if (enabled) {
            onError?.(errorMsg)
          }
        } else if (event.code === 1000) {
          // Normal closure - don't show error
          console.log('[WebSocket] Connection closed normally')
        } else if (event.code === 1001) {
          // Going away (normal) - don't show error
          console.log('[WebSocket] Connection going away (normal)')
        } else if (event.code === 1005) {
          // No status code - don't show error
          console.log('[WebSocket] Connection closed with no status code')
        } else {
          // Other error codes - show error only if enabled and not going to reconnect
          console.warn('[WebSocket] Connection closed with code:', event.code, 'Reason:', event.reason)
          if (enabled) {
            onError?.(`WebSocket connection closed: ${event.reason || `Code ${event.code}`}`)
          }
        }

        // Attempt reconnect after 3 seconds (only if enabled and not a normal closure)
        // Don't retry on code 1006 (abnormal closure) or 1008 (auth failure) - these need manual intervention
        // Also limit retries to prevent infinite loops
        if (enabled && event.code !== 1000 && event.code !== 1001 && event.code !== 1005 && 
            event.code !== 1006 && event.code !== 1008 && retryCountRef.current < maxRetries) {
          retryCountRef.current += 1
          console.log(`[WebSocket] Attempting to reconnect (attempt ${retryCountRef.current}/${maxRetries})...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        } else if (event.code === 1006 || event.code === 1008) {
          // Stop retrying for auth/abnormal closure errors - user needs to fix configuration
          retryCountRef.current = maxRetries // Prevent further retries
          hasFailedPermanentlyRef.current = true // Mark as permanently failed
          console.error('[WebSocket] Stopping retry attempts. Please check:')
          console.error('  1. WebSocket server is running: npm run dev:websocket')
          console.error('  2. JWT_SECRET matches between Next.js and WebSocket server')
          console.error('  3. Token is valid and not expired')
          console.error('[WebSocket] Connection permanently failed. Use the Retry button to try again after fixing the issue.')
        } else if (retryCountRef.current >= maxRetries) {
          hasFailedPermanentlyRef.current = true // Mark as permanently failed
          console.error('[WebSocket] Maximum retry attempts reached. Please check server status.')
          console.error('[WebSocket] Connection permanently failed. Use the Retry button to try again.')
        }
      }

      wsRef.current = ws
    } catch (error) {
      isConnectingRef.current = false
      console.error('[WebSocket] Failed to connect:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to establish WebSocket connection'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [enabled, agentId, token, WEBSOCKET_URL, onTranscript, onResponse, onAudioResponse, onError, onCallStarted, onCallEnded])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    isConnectingRef.current = false
    setIsConnected(false)
    setIsCallActive(false)
    setCallId(null)
  }, [])
  
  // Manual retry function that resets the permanent failure flag
  const retry = useCallback(() => {
    hasFailedPermanentlyRef.current = false
    retryCountRef.current = 0
    setError(null)
    connect()
  }, [connect])

  const startCall = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && agentId) {
      wsRef.current.send(JSON.stringify({
        type: 'start_call',
        agentId,
      }))
    }
  }, [agentId])

  const endCall = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end_call',
      }))
    }
    setIsCallActive(false)
    setCallId(null)
  }, [])

  const sendAudio = useCallback((audioBase64: string, language?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && agentId && callId) {
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        agentId,
        callId,
        data: audioBase64,
        language,
      }))
    } else {
      onError?.('WebSocket not connected or call not active')
    }
  }, [agentId, callId, onError])

  const sendText = useCallback((text: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && agentId) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        agentId,
        data: text,
        conversationHistory,
      }))
    }
  }, [agentId])

  useEffect(() => {
    // Only auto-connect if enabled and we haven't permanently failed
    if (enabled && !hasFailedPermanentlyRef.current) {
      connect()
    }

    return () => {
      disconnect()
    }
    // Only depend on enabled - don't re-run when connect/disconnect change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return {
    isConnected,
    isCallActive,
    callId,
    error,
    connect,
    disconnect,
    retry, // Expose retry function for manual retry after permanent failure
    startCall,
    endCall,
    sendAudio,
    sendText,
  }
}

