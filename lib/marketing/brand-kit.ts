export const BRAND_STORAGE_KEY = 'creativeStudioBrand'

export interface StoredBrand {
  primaryColor?: string
  tagline?: string
}

export function getStoredBrand(): StoredBrand | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredBrand
    return parsed.primaryColor || parsed.tagline ? parsed : null
  } catch {
    return null
  }
}

export function setStoredBrand(brand: StoredBrand | null): void {
  if (typeof window === 'undefined') return
  try {
    if (brand && (brand.primaryColor || brand.tagline)) {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand))
    } else {
      localStorage.removeItem(BRAND_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function brandPromptSuffix(brand: StoredBrand | null): string {
  if (!brand) return ''
  const parts: string[] = []
  if (brand.primaryColor?.trim()) parts.push(`Use brand color ${brand.primaryColor.trim()} where relevant.`)
  if (brand.tagline?.trim()) parts.push(`Incorporate tagline: "${brand.tagline.trim()}" where it fits.`)
  return parts.length ? ' ' + parts.join(' ') : ''
}
