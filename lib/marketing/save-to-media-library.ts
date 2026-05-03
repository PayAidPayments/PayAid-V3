/**
 * Save a data URL image to the tenant media library (Creative Studio → Media Library).
 * Call from Product Studio, Image Ads, etc. with auth token.
 */
export type SaveToMediaLibraryOptions = {
  dataUrl: string
  fileName: string
  title: string
  source: 'product-studio' | 'image-ads' | 'model-studio'
  description?: string
  tags?: string[]
  category?: string
  originalPrompt?: string
  authToken: string
}

export async function saveToMediaLibrary(opts: SaveToMediaLibraryOptions): Promise<{ id: string }> {
  const { dataUrl, fileName, title, source, authToken } = opts
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const fileSize = blob.size
  const mimeType = blob.type || 'image/png'

  const width = await new Promise<number>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth || img.width)
    img.onerror = reject
    img.src = dataUrl
  })
  const height = await new Promise<number>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalHeight || img.height)
    img.onerror = reject
    img.src = dataUrl
  })

  const response = await fetch('/api/media-library', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      fileName,
      fileUrl: dataUrl,
      fileSize,
      mimeType,
      width,
      height,
      title,
      description: opts.description,
      tags: opts.tags ?? ['creative-studio', source],
      category: opts.category ?? 'creative-studio',
      source,
      originalPrompt: opts.originalPrompt,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || err.error || 'Failed to save to media library')
  }
  const data = await response.json()
  return { id: data.id }
}
