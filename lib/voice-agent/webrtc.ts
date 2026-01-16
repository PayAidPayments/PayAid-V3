/**
 * WebRTC Integration for Browser-Based Voice Calls
 * Uses WebRTC API for real-time audio communication
 */

export interface WebRTCConfig {
  iceServers: RTCConfiguration['iceServers']
  audioConstraints?: MediaStreamConstraints
}

export class VoiceAgentWebRTC {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private onAudioReceived?: (audio: Blob) => void
  private onTranscriptReceived?: (text: string) => void
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void

  constructor(
    private config: WebRTCConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      audioConstraints: {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      },
    }
  ) {}

  /**
   * Initialize WebRTC connection
   */
  async initialize(): Promise<void> {
    try {
      // Get user media (microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia(
        this.config.audioConstraints || { audio: true }
      )

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.config)

      // Add local stream tracks
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!)
        }
      })

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        this.onAudioReceived?.(new Blob([], { type: 'audio/wav' }))
      }

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection) {
          this.onConnectionStateChange?.(this.peerConnection.connectionState)
        }
      }

      // Create data channel for transcripts
      this.dataChannel = this.peerConnection.createDataChannel('transcript', {
        ordered: true,
      })

      this.dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'transcript') {
            this.onTranscriptReceived?.(data.text)
          }
        } catch (error) {
          console.error('Failed to parse data channel message:', error)
        }
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to server
          this.sendIceCandidate(event.candidate)
        }
      }
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
      throw error
    }
  }

  /**
   * Create offer and start call
   */
  async startCall(agentId: string): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('WebRTC not initialized')
    }

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)

    // Send offer to server
    const response = await fetch(`/api/v1/voice-agents/${agentId}/webrtc/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer }),
    })

    if (!response.ok) {
      throw new Error('Failed to send offer')
    }

    const { answer } = await response.json()
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))

    return offer
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('WebRTC not initialized')
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  /**
   * Send ICE candidate to server
   */
  private async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    // Implementation depends on your signaling server
    // This is a placeholder
    console.log('ICE candidate:', candidate)
  }

  /**
   * Send audio chunk to server for processing
   */
  async sendAudioChunk(audioBlob: Blob, callId: string): Promise<void> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.wav')
    formData.append('callId', callId)

    const response = await fetch(`/api/v1/voice-agents/calls/${callId}/process`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to process audio')
    }

    const { agentAudioUrl, transcript } = await response.json()

    // Play agent audio response
    if (agentAudioUrl) {
      await this.playAudio(agentAudioUrl)
    }

    // Display transcript
    if (transcript) {
      this.onTranscriptReceived?.(transcript)
    }
  }

  /**
   * Play audio from URL
   */
  private async playAudio(audioUrl: string): Promise<void> {
    const audio = new Audio(audioUrl)
    await audio.play()
  }

  /**
   * End call
   */
  async endCall(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
    }
    if (this.peerConnection) {
      this.peerConnection.close()
    }
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
  }

  /**
   * Get local audio stream (for UI display)
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Get remote audio stream (for UI display)
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  /**
   * Set callbacks
   */
  onAudio(callback: (audio: Blob) => void): void {
    this.onAudioReceived = callback
  }

  onTranscript(callback: (text: string) => void): void {
    this.onTranscriptReceived = callback
  }

  onConnectionState(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChange = callback
  }
}

