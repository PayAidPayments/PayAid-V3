import { NextRequest, NextResponse } from 'next/server'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { z } from 'zod'

const jobSchema = z.object({
  jobId: z.string().min(1),
  type: z.literal('video'),
  imageUrl: z.string().url().optional(),
  prompt: z.string().optional(),
  durationSec: z.number().min(3).max(60).optional(),
  aspectRatio: z.enum(['9:16', '16:9']).optional(),
  tenantId: z.string().optional(),
})

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => (err += d.toString()))
    p.on('error', (e) => reject(e))
    p.on('close', (code) => {
      if (code === 0) resolve()
      else {
        const tail = err.trim().split(/\r?\n/).filter(Boolean).slice(-8).join('\n')
        reject(new Error(tail || err || `ffmpeg exited with code ${code}`))
      }
    })
  })
}

/** Static image → H.264 MP4 (widely compatible; used as fallback if Ken Burns filter fails). */
function buildStaticVideoArgs(inputPath: string, outputPath: string, duration: number, fps: number): string[] {
  const vf = [
    'scale=1080:1920:force_original_aspect_ratio=decrease',
    'pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
    'format=yuv420p',
  ].join(',')
  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-loop',
    '1',
    '-i',
    inputPath,
    '-t',
    String(duration),
    '-r',
    String(fps),
    '-vf',
    vf,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    outputPath,
  ]
}

/** Next.js serves `public/` at site root; cwd may be repo root or `apps/dashboard`. */
function resolveGeneratedVideosDir(): string {
  const cwd = process.cwd()
  const fromRepoRoot = join(cwd, 'apps', 'dashboard', 'public', 'generated', 'videos')
  const fromAppRoot = join(cwd, 'public', 'generated', 'videos')
  const dir = existsSync(join(cwd, 'apps', 'dashboard', 'package.json')) ? fromRepoRoot : fromAppRoot
  mkdirSync(dir, { recursive: true })
  return dir
}

// POST AI_VIDEO_QUEUE_URL
// Local dev worker: turns a single image into a short MP4 using ffmpeg.
export async function POST(request: NextRequest) {
  try {
    const secret = (process.env.AI_VIDEO_QUEUE_SECRET || '').trim()
    if (secret) {
      const got = (request.headers.get('x-payaid-video-queue-secret') || '').trim()
      if (got !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const job = jobSchema.parse(body)

    if (!job.imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required for localhost video worker' },
        { status: 400 }
      )
    }

    const duration = Math.max(3, Math.min(60, job.durationSec ?? 8))

    const imgRes = await fetch(job.imageUrl)
    if (!imgRes.ok) {
      const t = await imgRes.text().catch(() => imgRes.statusText)
      return NextResponse.json(
        { error: `Failed to download image: ${imgRes.status} ${t.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const buf = Buffer.from(await imgRes.arrayBuffer())
    const outDir = resolveGeneratedVideosDir()
    const inputPath = join(outDir, `${job.jobId}.png`)
    const outputPath = join(outDir, `${job.jobId}.mp4`)
    writeFileSync(inputPath, buf)

    // Ken Burns–style motion via zoompan (slow zoom + pan). Not “AI video” — one still → short clip.
    // `s` must be WxH with an "x" (e.g. 1080x1920). Zoom step tuned so motion is visible on a 8–15s clip.
    const fps = 30
    const totalFrames = duration * fps
    const vf =
      "scale=1280:-2,zoompan=z='min(1.18,zoom+0.0012)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=" +
      totalFrames +
      ':s=1080x1920,format=yuv420p'

    try {
      await runFfmpeg([
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-loop',
        '1',
        '-i',
        inputPath,
        '-t',
        String(duration),
        '-r',
        String(fps),
        '-vf',
        vf,
        '-c:v',
        'libx264',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        outputPath,
      ])
    } catch (firstErr) {
      // Fallback: no motion, still a valid short MP4 for previews (avoids zoompan / filter edge cases).
      try {
        await runFfmpeg(buildStaticVideoArgs(inputPath, outputPath, duration, fps))
      } catch (fallbackErr) {
        const a = firstErr instanceof Error ? firstErr.message : String(firstErr)
        const b = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        throw new Error(`Ken Burns / zoompan failed:\n${a}\n\nStatic fallback failed:\n${b}`)
      }
    }

    const url = `/generated/videos/${job.jobId}.mp4`
    return NextResponse.json({ url, durationSec: duration, width: 1080, height: 1920 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job payload', details: err.errors }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        error: 'Video worker failed',
        details: message,
        hint:
          'Ensure ffmpeg is on PATH with libx264 (e.g. gyan.dev full build). If errors persist, check details below — the worker falls back to a static image→video encode when zoompan fails.',
      },
      { status: 502 }
    )
  }
}

