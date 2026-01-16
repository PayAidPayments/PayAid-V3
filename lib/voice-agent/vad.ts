/**
 * Voice Activity Detection (VAD)
 * FREE client-side implementation for detecting speech in audio
 * 
 * This is a simple energy-based VAD that works entirely client-side
 * No external APIs or paid services required
 */

export interface VADConfig {
  energyThreshold?: number // Minimum energy to consider as speech (0.01 default)
  silenceDuration?: number // Max silence duration before considering speech ended (ms)
  minSpeechDuration?: number // Minimum duration to consider as valid speech (ms)
  sampleRate?: number // Audio sample rate (default: 16000)
}

export class VoiceActivityDetector {
  private energyThreshold: number
  private silenceDuration: number
  private minSpeechDuration: number
  private sampleRate: number
  private lastSpeechTime: number = 0
  private speechStartTime: number = 0
  private isSpeaking: boolean = false
  private silenceStartTime: number = 0

  constructor(config: VADConfig = {}) {
    this.energyThreshold = config.energyThreshold ?? 0.01
    this.silenceDuration = config.silenceDuration ?? 1000 // 1 second
    this.minSpeechDuration = config.minSpeechDuration ?? 200 // 200ms
    this.sampleRate = config.sampleRate ?? 16000
  }

  /**
   * Detect if audio buffer contains speech
   * @param audioBuffer - Audio buffer (16-bit PCM)
   * @returns true if speech detected, false if silence
   */
  detectSpeech(audioBuffer: Buffer): boolean {
    const energy = this.calculateEnergy(audioBuffer)
    const now = Date.now()

    if (energy > this.energyThreshold) {
      // Speech detected
      if (!this.isSpeaking) {
        // Speech just started
        this.speechStartTime = now
        this.isSpeaking = true
      }
      this.lastSpeechTime = now
      this.silenceStartTime = 0
      return true
    } else {
      // Silence detected
      if (this.isSpeaking) {
        // We were speaking, now silence
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = now
        }

        const silenceDuration = now - this.silenceStartTime
        if (silenceDuration > this.silenceDuration) {
          // Silence duration exceeded - speech ended
          const speechDuration = this.silenceStartTime - this.speechStartTime
          if (speechDuration >= this.minSpeechDuration) {
            // Valid speech segment
            this.isSpeaking = false
            return false
          } else {
            // Too short, ignore
            this.isSpeaking = false
            return false
          }
        } else {
          // Still within silence tolerance - consider as continuation
          return true
        }
      } else {
        // Already in silence
        return false
      }
    }
  }

  /**
   * Calculate RMS (Root Mean Square) energy of audio buffer
   * Higher energy typically indicates speech
   */
  private calculateEnergy(buffer: Buffer): number {
    if (buffer.length < 2) return 0

    let sum = 0
    let sampleCount = 0

    // Process 16-bit PCM samples (2 bytes per sample)
    for (let i = 0; i < buffer.length - 1; i += 2) {
      const sample = buffer.readInt16LE(i)
      sum += sample * sample
      sampleCount++
    }

    if (sampleCount === 0) return 0

    // RMS energy
    const meanSquare = sum / sampleCount
    const rms = Math.sqrt(meanSquare)

    // Normalize to 0-1 range (16-bit PCM max value is 32767)
    return rms / 32767
  }

  /**
   * Reset VAD state (useful for new conversation turn)
   */
  reset(): void {
    this.lastSpeechTime = 0
    this.speechStartTime = 0
    this.isSpeaking = false
    this.silenceStartTime = 0
  }

  /**
   * Get current speech state
   */
  getState(): {
    isSpeaking: boolean
    speechDuration: number
    silenceDuration: number
  } {
    const now = Date.now()
    return {
      isSpeaking: this.isSpeaking,
      speechDuration: this.isSpeaking ? now - this.speechStartTime : 0,
      silenceDuration: this.silenceStartTime > 0 ? now - this.silenceStartTime : 0,
    }
  }
}
