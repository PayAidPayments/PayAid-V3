/**
 * Template Fallback System
 * Provides fallback behavior when templates are not available
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { VideoTemplate } from './video-templates'

/**
 * Check if template file exists
 */
export function templateExists(template: VideoTemplate): boolean {
  const templatePath = join(process.cwd(), 'public', template.videoUrl)
  return existsSync(templatePath)
}

/**
 * Get available templates (filter out missing ones)
 */
export function getAvailableTemplates(templates: VideoTemplate[]): VideoTemplate[] {
  return templates.filter((template) => templateExists(template))
}

/**
 * Check if all required templates are available
 */
export function checkTemplatesAvailable(): {
  available: number
  total: number
  missing: string[]
} {
  const { VIDEO_TEMPLATES } = require('./video-templates')
  const available = getAvailableTemplates(VIDEO_TEMPLATES)
  const missing = VIDEO_TEMPLATES.filter(
    (t: VideoTemplate) => !templateExists(t)
  ).map((t: VideoTemplate) => t.name)

  return {
    available: available.length,
    total: VIDEO_TEMPLATES.length,
    missing,
  }
}

/**
 * Get template status message
 */
export function getTemplateStatusMessage(): string {
  const status = checkTemplatesAvailable()
  
  if (status.available === status.total) {
    return '✅ All video templates are available'
  }
  
  if (status.available === 0) {
    return `⚠️ No video templates found. Please add templates to public/video-templates/\n   Missing: ${status.missing.join(', ')}`
  }
  
  return `⚠️ Some templates are missing (${status.available}/${status.total} available)\n   Missing: ${status.missing.join(', ')}`
}

