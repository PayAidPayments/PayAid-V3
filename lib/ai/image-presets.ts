/**
 * Platform size and negative-prompt presets for AI Image Studio.
 */

export const PLATFORM_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: '1024x1024', label: 'Square (1:1)' },
  { value: '1024x1792', label: 'Portrait (9:16)' },
  { value: '1792x1024', label: 'Landscape (16:9)' },
  { value: '1080x1080', label: 'Instagram Post' },
  { value: '1080x1920', label: 'Instagram Story / Reels' },
  { value: '1200x630', label: 'Facebook / LinkedIn Share' },
  { value: '1584x396', label: 'LinkedIn Banner' },
  { value: '1200x1200', label: 'Google / Amazon' },
  { value: '1000x1500', label: 'Pinterest' },
]

export const NEGATIVE_PROMPT_PRESETS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'blurry, low quality, distorted', label: 'Avoid blurry / low quality' },
  { value: 'text, watermark, logo, signature', label: 'Avoid text & watermarks' },
  { value: 'blurry, text, watermark, low quality, distorted, ugly', label: 'High quality only' },
  { value: 'nsfw, adult, explicit', label: 'Safe for work' },
]
