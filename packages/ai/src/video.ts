/**
 * Video generation: enqueue-only by default (keep API off the GPU path).
 */

import { getVideoQueueSecret, getVideoQueueUrl } from './config'
import type { MediaResult, VideoJobResult, VideoWorkerOptions } from './types'

export interface GenerateVideoParams {
  prompt?: string
  imageUrl?: string
  durationSec?: number
  aspectRatio?: '9:16' | '16:9'
  tenantId?: string
  options?: VideoWorkerOptions
}

/**
 * If `AI_VIDEO_QUEUE_URL` is set, POST job payload and return queued job id.
 * Otherwise returns `unconfigured` (worker / ComfyUI video should be wired there).
 */
export async function generateVideo(params: GenerateVideoParams): Promise<VideoJobResult> {
  const queue = getVideoQueueUrl()
  if (!queue) {
    return {
      status: 'unconfigured',
      message:
        'Video queue not configured. Set AI_VIDEO_QUEUE_URL to a worker that runs ComfyUI AnimateDiff/SVD (or similar).',
    }
  }

  const jobId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `job-${Date.now()}`

  const body = {
    jobId,
    type: 'video' as const,
    prompt: params.prompt,
    imageUrl: params.imageUrl,
    durationSec: params.durationSec ?? 8,
    aspectRatio: params.aspectRatio ?? '9:16',
    tenantId: params.tenantId,
    options: params.options,
  }

  const secret = getVideoQueueSecret()
  const res = await fetch(queue, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-payaid-video-queue-secret': secret } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText)
    return {
      status: 'error',
      message: `Video queue rejected: ${res.status} ${t.slice(0, 1200)}`,
    }
  }

  let result: MediaResult | undefined
  try {
    const json = (await res.json()) as { url?: string; durationSec?: number; width?: number; height?: number }
    if (json.url) {
      result = {
        url: json.url,
        durationSec: json.durationSec,
        width: json.width,
        height: json.height,
      }
    }
  } catch {
    /* queue may return 202 empty */
  }

  return {
    status: result?.url ? 'completed' : 'queued',
    jobId,
    result,
    message: result?.url ? 'Video ready — preview below.' : 'Job accepted — waiting for video URL.',
  }
}

/** Marketing primitive: image → short video (always queued when configured). */
export async function videoFromImage(
  params: Omit<GenerateVideoParams, 'prompt'> & { prompt?: string }
): Promise<VideoJobResult> {
  return generateVideo(params)
}
