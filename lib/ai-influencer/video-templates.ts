/**
 * Video Template Management
 * Manages pre-recorded video templates for AI influencer videos
 */

export type VideoTemplateStyle = 'testimonial' | 'demo' | 'problem-solution'

export interface VideoTemplate {
  id: string
  style: VideoTemplateStyle
  name: string
  description: string
  videoUrl: string // Path to template video file
  duration: number // seconds
  gender: 'male' | 'female' | 'both'
  ageRange: string[]
  thumbnailUrl?: string
}

/**
 * Video templates stored in public/video-templates/
 * In production, these should be in PayAid Drive or S3
 */
export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // Testimonial - Female
  {
    id: 'testimonial-female-1',
    style: 'testimonial',
    name: 'Female Testimonial - Indoor 1',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-female-indoor-1.mp4',
    duration: 30,
    gender: 'female',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-female-2',
    style: 'testimonial',
    name: 'Female Testimonial - Indoor 2',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-female-indoor-2.mp4',
    duration: 30,
    gender: 'female',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-female-3',
    style: 'testimonial',
    name: 'Female Testimonial - Indoor 3',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-female-indoor-3.mp4',
    duration: 30,
    gender: 'female',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-female-4',
    style: 'testimonial',
    name: 'Female Testimonial - Indoor 4',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-female-indoor-4.mp4',
    duration: 30,
    gender: 'female',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-female-5',
    style: 'testimonial',
    name: 'Female Testimonial - Indoor 5',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-female-indoor-5.mp4',
    duration: 30,
    gender: 'female',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-female-6',
    style: 'testimonial',
    name: 'Female Testimonial - Indoor 6',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-female-indoor-6.mp4',
    duration: 30,
    gender: 'female',
    ageRange: ['25-35', '35-45'],
  },
  // Testimonial - Male
  {
    id: 'testimonial-male-1',
    style: 'testimonial',
    name: 'Male Testimonial - Indoor 1',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-male-indoor1.mp4',
    duration: 30,
    gender: 'male',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-male-2',
    style: 'testimonial',
    name: 'Male Testimonial - Indoor 2',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-male-indoor2.mp4',
    duration: 30,
    gender: 'male',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-male-3',
    style: 'testimonial',
    name: 'Male Testimonial - Indoor 3',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-male-indoor3.mp4',
    duration: 30,
    gender: 'male',
    ageRange: ['25-35', '35-45'],
  },
  {
    id: 'testimonial-male-4',
    style: 'testimonial',
    name: 'Male Testimonial - Indoor 4',
    description: 'Professional indoor testimonial style',
    videoUrl: '/video-templates/testimonial-male-indoor4.mp4',
    duration: 30,
    gender: 'male',
    ageRange: ['25-35', '35-45'],
  },
  // Demo - Female
  {
    id: 'demo-female-1',
    style: 'demo',
    name: 'Female Product Demo 1',
    description: 'Product demonstration style',
    videoUrl: '/video-templates/demo-female1.mp4',
    duration: 45,
    gender: 'female',
    ageRange: ['25-35'],
  },
  {
    id: 'demo-female-2',
    style: 'demo',
    name: 'Female Product Demo 2',
    description: 'Product demonstration style',
    videoUrl: '/video-templates/demo-female2.mp4',
    duration: 45,
    gender: 'female',
    ageRange: ['25-35'],
  },
  {
    id: 'demo-female-3',
    style: 'demo',
    name: 'Female Product Demo 3',
    description: 'Product demonstration style',
    videoUrl: '/video-templates/demo-female3.mp4',
    duration: 45,
    gender: 'female',
    ageRange: ['25-35'],
  },
  {
    id: 'demo-female-4',
    style: 'demo',
    name: 'Female Product Demo 4',
    description: 'Product demonstration style',
    videoUrl: '/video-templates/demo-female4.mp4',
    duration: 45,
    gender: 'female',
    ageRange: ['25-35'],
  },
  // Problem-Solution - Female
  {
    id: 'problem-solution-female-1',
    style: 'problem-solution',
    name: 'Problem-Solution Female 1',
    description: 'Problem-solution narrative style',
    videoUrl: '/video-templates/problem-solution-female1.mp4',
    duration: 40,
    gender: 'female',
    ageRange: ['25-35'],
  },
  {
    id: 'problem-solution-female-2',
    style: 'problem-solution',
    name: 'Problem-Solution Female 2',
    description: 'Problem-solution narrative style',
    videoUrl: '/video-templates/problem-solution-female2.mp4',
    duration: 40,
    gender: 'female',
    ageRange: ['25-35'],
  },
  {
    id: 'problem-solution-female-3',
    style: 'problem-solution',
    name: 'Problem-Solution Female 3',
    description: 'Problem-solution narrative style',
    videoUrl: '/video-templates/problem-solution-female3.mp4',
    duration: 40,
    gender: 'female',
    ageRange: ['25-35'],
  },
  {
    id: 'problem-solution-female-4',
    style: 'problem-solution',
    name: 'Problem-Solution Female 4',
    description: 'Problem-solution narrative style',
    videoUrl: '/video-templates/problem-solution-female4.mp4',
    duration: 40,
    gender: 'female',
    ageRange: ['25-35'],
  },
]

/**
 * Get template by style and character attributes
 * Randomly selects from available templates for variety
 */
export function getTemplateForStyle(
  style: VideoTemplateStyle,
  gender: string,
  ageRange?: string
): VideoTemplate | null {
  let matching = VIDEO_TEMPLATES.filter(
    (t) => t.style === style && (t.gender === gender || t.gender === 'both')
  )

  if (matching.length === 0) {
    // Fallback to any template with matching style
    matching = VIDEO_TEMPLATES.filter((t) => t.style === style)
    if (matching.length === 0) {
      return null
    }
  }

  // If age range specified, prefer matching age range
  if (ageRange) {
    const ageMatch = matching.filter((t) => t.ageRange.includes(ageRange))
    if (ageMatch.length > 0) {
      matching = ageMatch
    }
  }

  // Randomly select from matching templates for variety
  const randomIndex = Math.floor(Math.random() * matching.length)
  return matching[randomIndex]
}

/**
 * Get all available templates for a style
 */
export function getTemplatesForStyle(
  style: VideoTemplateStyle,
  gender?: string
): VideoTemplate[] {
  if (gender) {
    return VIDEO_TEMPLATES.filter(
      (t) => t.style === style && (t.gender === gender || t.gender === 'both')
    )
  }
  return VIDEO_TEMPLATES.filter((t) => t.style === style)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): VideoTemplate | null {
  return VIDEO_TEMPLATES.find((t) => t.id === id) || null
}

