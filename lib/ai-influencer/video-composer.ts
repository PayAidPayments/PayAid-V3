/**
 * Video Composition Service
 * Uses FFmpeg to compose final video with:
 * - Template video with overlaid character face
 * - Audio (text-to-speech)
 * - Music (royalty-free)
 * - Branding (watermark/logo)
 */

import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

// Configure fluent-ffmpeg to use system FFmpeg
// fluent-ffmpeg should auto-detect FFmpeg from PATH, but we can set it explicitly
// This initialization happens asynchronously and won't block module loading
if (process.platform === 'win32') {
  // Initialize FFmpeg path detection (non-blocking)
  execAsync('where.exe ffmpeg')
    .then(({ stdout }) => {
      const ffmpegPath = stdout.trim().split('\n')[0]
      if (ffmpegPath && existsSync(ffmpegPath)) {
        const ffmpegDir = join(ffmpegPath, '..')
        const ffmpegExe = join(ffmpegDir, 'ffmpeg.exe')
        const ffprobeExe = join(ffmpegDir, 'ffprobe.exe')
        
        if (existsSync(ffmpegExe)) {
          ffmpeg.setFfmpegPath(ffmpegExe)
        }
        if (existsSync(ffprobeExe)) {
          ffmpeg.setFfprobePath(ffprobeExe)
        }
        console.log('FFmpeg configured:', ffmpegExe)
      }
    })
    .catch(() => {
      // FFmpeg will be auto-detected from PATH if available
      // This is fine - fluent-ffmpeg will find it automatically
    })
}

export interface VideoCompositionOptions {
  templateVideoPath: string
  characterFacePath: string
  audioPath: string
  outputPath: string
  musicPath?: string
  watermarkPath?: string
  lipSyncData?: Array<{ time: number; shape: string }>
  duration?: number
}

/**
 * Compose final video using FFmpeg
 */
export async function composeVideo(
  options: VideoCompositionOptions
): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = join(options.outputPath, '..')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // Check if FFmpeg is available
    await checkFFmpegInstalled()

    return new Promise((resolve, reject) => {
      const command = ffmpeg(options.templateVideoPath)

      // Set output format
      command.outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        '-movflags +faststart',
      ])

      // Overlay character face (simplified - full implementation needs face tracking)
      // For now, we'll overlay the face image on the template
      if (existsSync(options.characterFacePath)) {
        command
          .input(options.characterFacePath)
          .complexFilter([
            // Overlay face on template (placeholder - needs proper face tracking)
            `[0:v][1:v]overlay=W/2-w/2:H/2-h/2:enable='between(t,0,${options.duration || 30})'[v]`,
          ])
          .outputOptions(['-map [v]', '-map 0:a?'])
      }

      // Add audio
      if (existsSync(options.audioPath)) {
        command.input(options.audioPath)
        command.outputOptions(['-map 1:a'])
      }

      // Add music (if provided)
      if (options.musicPath && existsSync(options.musicPath)) {
        command.input(options.musicPath)
        command.complexFilter([
          // Mix audio tracks (simplified)
          '[1:a][2:a]amix=inputs=2:duration=first:dropout_transition=2[a]',
        ])
        command.outputOptions(['-map [a]'])
      }

      // Add watermark (if provided)
      if (options.watermarkPath && existsSync(options.watermarkPath)) {
        command.input(options.watermarkPath)
        command.complexFilter([
          // Overlay watermark in bottom-right corner
          `[0:v][2:v]overlay=W-w-10:H-h-10:enable='between(t,0,${options.duration || 30})'[v]`,
        ])
      }

      // Set duration
      if (options.duration) {
        command.duration(options.duration)
      }

      // Set output
      command.output(options.outputPath)

      // Execute
      command
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine)
        })
        .on('progress', (progress) => {
          console.log(`Video processing: ${Math.round(progress.percent || 0)}%`)
        })
        .on('end', () => {
          console.log('Video composition complete')
          resolve(options.outputPath)
        })
        .on('error', (error) => {
          console.error('FFmpeg error:', error)
          reject(error)
        })
        .run()
    })
  } catch (error) {
    console.error('Video composition error:', error)
    throw error
  }
}

/**
 * Simplified video composition (without face overlay for now)
 * This is a fallback when full composition fails
 */
export async function composeSimpleVideo(
  templatePath: string,
  audioPath: string,
  outputPath: string,
  duration?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(templatePath)

    // Add audio
    if (existsSync(audioPath)) {
      command.input(audioPath)
    }

    // Set output options
    command.outputOptions([
      '-c:v copy', // Copy video stream
      '-c:a aac', // Encode audio
      '-b:a 192k',
      '-shortest', // Match shortest input
    ])

    if (duration) {
      command.duration(duration)
    }

    command
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}

/**
 * Check if FFmpeg is installed
 */
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

/**
 * Get video duration
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      const duration = metadata.format?.duration || 0
      resolve(duration)
    })
  })
}

