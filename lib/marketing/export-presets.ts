/**
 * Export presets for Creative Studio outputs (Product Studio, Image Ads).
 * Resizes image to target dimensions and triggers download.
 */
export interface ExportPreset {
  id: string
  label: string
  width: number
  height: number
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'amazon', label: 'Amazon (3000×3000)', width: 3000, height: 3000 },
  { id: 'meta-feed', label: 'Meta Feed (1:1, 1080×1080)', width: 1080, height: 1080 },
  { id: 'meta-story', label: 'Stories / Reels (9:16, 1080×1920)', width: 1080, height: 1920 },
  { id: 'google', label: 'Google (1:1, 1200×1200)', width: 1200, height: 1200 },
  { id: 'pinterest', label: 'Pinterest (2:3, 1000×1500)', width: 1000, height: 1500 },
]

export async function exportImageAtSize(
  dataUrl: string,
  width: number,
  height: number,
  filename: string
): Promise<void> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const scale = Math.min(width / img.width, height / img.height)
  const dx = (width - img.width * scale) / 2
  const dy = (height - img.height * scale) / 2
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale)

  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
