/**
 * Caption + OCR via AI Gateway image-to-text (BLIP-2 + PaddleOCR pattern).
 */

import { getAiGatewayUrl } from './config'

export interface VisionGatewayOptions {
  bearerToken?: string
}

export async function captionImage(
  imageUrl: string,
  options?: VisionGatewayOptions
): Promise<{ caption: string; tags?: string[] }> {
  const gw = getAiGatewayUrl()
  if (!gw) {
    throw new Error('Vision not configured. Set AI_GATEWAY_URL for /api/image-to-text.')
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options?.bearerToken) headers.Authorization = `Bearer ${options.bearerToken}`

  const res = await fetch(`${gw}/api/image-to-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_url: imageUrl, task: 'caption' }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText)
    throw new Error(`Vision caption ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = (await res.json()) as { caption?: string; tags?: string[] }
  if (!data.caption) throw new Error('Caption missing in response')
  return { caption: data.caption, tags: data.tags }
}

export async function ocrImage(
  imageUrl: string,
  options?: VisionGatewayOptions
): Promise<{ text: string }> {
  const gw = getAiGatewayUrl()
  if (!gw) {
    throw new Error('OCR not configured. Set AI_GATEWAY_URL for /api/image-to-text.')
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options?.bearerToken) headers.Authorization = `Bearer ${options.bearerToken}`

  const res = await fetch(`${gw}/api/image-to-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_url: imageUrl, task: 'ocr' }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText)
    throw new Error(`OCR ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = (await res.json()) as { ocr_text?: string; text?: string }
  const text = data.ocr_text ?? data.text ?? ''
  if (!text) throw new Error('OCR text missing in response')
  return { text }
}
