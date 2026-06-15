/**
 * Queued TTS playback with immediate interrupt (stop + clear).
 */

export class AudioPlaybackQueue {
  private queue: HTMLAudioElement[] = []
  private current: HTMLAudioElement | null = null
  private objectUrls: string[] = []
  private generation = 0

  /** Stop audible output and discard pending chunks. */
  interrupt(): number {
    const interruptedAt = performance.now()
    this.generation += 1
    if (this.current) {
      try {
        this.current.pause()
        this.current.currentTime = 0
        this.current.onended = null
        this.current.onerror = null
      } catch {
        /* ignore */
      }
      this.current = null
    }
    for (const a of this.queue) {
      try {
        a.pause()
        a.onended = null
      } catch {
        /* ignore */
      }
    }
    this.queue = []
    for (const url of this.objectUrls) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        /* ignore */
      }
    }
    this.objectUrls = []
    return interruptedAt
  }

  async enqueueBase64(base64: string, mime: string): Promise<void> {
    const gen = this.generation
    const bytes = Uint8Array.from(atob(base64.replace(/\s/g, '')), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    this.objectUrls.push(url)
    const audio = new Audio(url)
    this.queue.push(audio)
    await this.playNext(gen)
  }

  private playNext(gen: number): Promise<void> {
    if (gen !== this.generation) return Promise.resolve()
    if (this.current || this.queue.length === 0) return Promise.resolve()
    const audio = this.queue.shift()!
    this.current = audio
    return new Promise((resolve) => {
      const done = () => {
        if (gen !== this.generation) {
          resolve()
          return
        }
        this.current = null
        void this.playNext(gen).then(resolve)
      }
      audio.onended = done
      audio.onerror = done
      audio.play().catch(done)
    })
  }

  dispose() {
    this.interrupt()
  }
}
