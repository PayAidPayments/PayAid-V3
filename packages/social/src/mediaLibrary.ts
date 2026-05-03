/**
 * PayAid Social – Media Library client.
 * Uses tenant storage (PayAid Drive / Supabase or R2). Hash by tenant + campaign to avoid duplicates.
 * Caller passes apiBaseUrl and auth headers; this package is UI-agnostic.
 */

import type { MediaItem } from './types'

export interface SaveMediaParams {
  tenantId: string
  fileBuffer: ArrayBuffer | Blob
  mimeType: string
  tags?: string[]
  category?: string
  fileName?: string
  campaignId?: string
}

export interface ListMediaParams {
  tenantId: string
  category?: string
  source?: string
  search?: string
  limit?: number
  offset?: number
}

export interface MediaLibraryClient {
  saveMedia(params: SaveMediaParams): Promise<{ id: string; url: string; thumbnailUrl?: string }>
  listMedia(params: ListMediaParams): Promise<{ items: MediaItem[]; total: number }>
}

/**
 * Create a client that talks to the app's /api/media-library (or /api/social/media).
 * Used by Studio Step 2 "Save to Library" and library page.
 */
export function createMediaLibraryClient(
  apiBaseUrl: string,
  getHeaders: () => HeadersInit
): MediaLibraryClient {
  return {
    async saveMedia(params) {
      const form = new FormData()
      if (params.fileBuffer instanceof Blob) {
        form.append('file', params.fileBuffer, params.fileName || 'upload')
      } else {
        form.append('file', new Blob([params.fileBuffer], { type: params.mimeType }), params.fileName || 'upload')
      }
      if (params.tags?.length) form.append('tags', JSON.stringify(params.tags))
      if (params.category) form.append('category', params.category)

      const res = await fetch(`${apiBaseUrl}/api/media-library`, {
        method: 'POST',
        headers: getHeaders(),
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save media')
      }
      const data = await res.json()
      return {
        id: data.id,
        url: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl,
      }
    },

    async listMedia(params) {
      const q = new URLSearchParams()
      if (params.category) q.set('category', params.category)
      if (params.source) q.set('source', params.source)
      if (params.search) q.set('search', params.search)
      q.set('limit', String(params.limit ?? 50))
      q.set('offset', String(params.offset ?? 0))

      const res = await fetch(`${apiBaseUrl}/api/media-library?${q}`, {
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error('Failed to list media')
      const data = await res.json()
      const items: MediaItem[] = (data.media || []).map((m: any) => ({
        id: m.id,
        url: m.fileUrl,
        thumbnailUrl: m.thumbnailUrl,
        mimeType: m.mimeType,
        fileName: m.fileName,
        width: m.width,
        height: m.height,
        tags: m.tags,
      }))
      return { items, total: data.total ?? items.length }
    },
  }
}
