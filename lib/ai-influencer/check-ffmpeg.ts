/**
 * Lightweight FFmpeg availability check (no fluent-ffmpeg).
 * Used by health/setup so the health route does not pull fluent-ffmpeg into the bundle.
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch {
    throw new Error(
      'FFmpeg is not installed. Please install FFmpeg to generate videos.\n' +
      'Download from: https://ffmpeg.org/download.html'
    )
  }
}
