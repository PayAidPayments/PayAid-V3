/**
 * Main Video Processor
 * Orchestrates the entire video generation pipeline:
 * 1. Download character image
 * 2. Detect face
 * 3. Generate audio from script
 * 4. Generate lip-sync data
 * 5. Select video template
 * 6. Compose final video
 */

import { prisma } from '@/lib/db/prisma'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { getTemplateForStyle } from './video-templates'
import { templateExists, getAvailableTemplates } from './template-fallback'
import { detectFace, extractFace } from './face-detection'
import { generateLipSync } from './lip-sync'
import { composeVideo, composeSimpleVideo, getVideoDuration } from './video-composer'
import { writeFile } from 'fs/promises'
import { statSync } from 'fs'

export interface VideoGenerationParams {
  videoId: string
  tenantId: string
  characterId: string
  scriptId: string
  style: 'testimonial' | 'demo' | 'problem-solution'
  cta?: string
}

/**
 * Process video generation
 */
export async function processVideoGeneration(
  params: VideoGenerationParams
): Promise<string> {
  const { videoId, tenantId, characterId, scriptId, style } = params

  try {
    // Update status to generating
    await prisma.aIInfluencerVideo.update({
      where: { id: videoId },
      data: { status: 'generating' },
    })

    // 1. Get character and script data
    const [character, script] = await Promise.all([
      prisma.aIInfluencerCharacter.findUnique({
        where: { id: characterId },
      }),
      prisma.aIInfluencerScript.findUnique({
        where: { id: scriptId },
      }),
    ])

    if (!character || !script) {
      throw new Error('Character or script not found')
    }

    // Get selected script variation
    const variations = (script.variations as any) || []
    const selectedVariation =
      script.selectedVariation !== null
        ? variations[script.selectedVariation]
        : variations[0]

    if (!selectedVariation) {
      throw new Error('No script variation selected')
    }

    // 2. Setup working directory
    const workDir = join(
      process.cwd(),
      'uploads',
      tenantId,
      'ai-influencer',
      'videos',
      videoId
    )
    if (!existsSync(workDir)) {
      mkdirSync(workDir, { recursive: true })
    }

    // 3. Download character image
    const characterImagePath = await downloadCharacterImage(
      character.imageUrl,
      join(workDir, 'character.png')
    )

    // 4. Detect face (placeholder for now)
    const faceDetection = await detectFace(characterImagePath)
    if (!faceDetection) {
      throw new Error('Face detection failed')
    }

    // 5. Generate audio from script
    const audioPath = await generateScriptAudio(
      selectedVariation.text,
      join(workDir, 'script-audio.wav'),
      tenantId
    )

    // 6. Generate lip-sync data
    const lipSyncData = await generateLipSync(
      audioPath,
      join(workDir, 'lip-sync.json')
    )

    // 7. Select video template
    const template = getTemplateForStyle(
      style,
      character.gender || 'female',
      character.ageRange || undefined
    )

    if (!template) {
      throw new Error(`No template found for style: ${style}`)
    }

    // Check if template exists
    if (!templateExists(template)) {
      throw new Error(
        `Template file not found: ${template.videoUrl}\n` +
        `Please add the template video to public/video-templates/`
      )
    }

    // Get template video path (in production, download from Drive/S3)
    const templatePath = join(process.cwd(), 'public', template.videoUrl)

    // 8. Compose final video
    const outputPath = join(workDir, 'final-video.mp4')
    
    let finalVideoPath: string
    try {
      // Try full composition
      finalVideoPath = await composeVideo({
        templateVideoPath: templatePath,
        characterFacePath: characterImagePath,
        audioPath: audioPath,
        outputPath: outputPath,
        lipSyncData: lipSyncData.data,
        duration: selectedVariation.duration || 30,
      })
    } catch (error) {
      console.warn('Full composition failed, using simple composition:', error)
      // Fallback to simple composition
      finalVideoPath = await composeSimpleVideo(
        templatePath,
        audioPath,
        outputPath,
        selectedVariation.duration || 30
      )
    }

    // 9. Upload final video to PayAid Drive
    const driveFile = await uploadVideoToDrive(
      finalVideoPath,
      tenantId,
      `AI Influencer Video - ${script.productName || 'Video'}`,
      videoId
    )

    // 10. Update video record
    const videoDuration = await getVideoDuration(finalVideoPath).catch(() => selectedVariation.duration || 30)

    await prisma.aIInfluencerVideo.update({
      where: { id: videoId },
      data: {
        status: 'ready',
        videoUrl: driveFile.fileUrl,
        driveFileId: driveFile.id,
        duration: Math.round(videoDuration),
        completedAt: new Date(),
      },
    })

    return finalVideoPath
  } catch (error) {
    // Update status to failed
    await prisma.aIInfluencerVideo.update({
      where: { id: videoId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    })
    throw error
  }
}

/**
 * Download character image
 */
async function downloadCharacterImage(
  imageUrl: string,
  outputPath: string
): Promise<string> {
  try {
    // If it's a local path, copy it
    if (imageUrl.startsWith('/uploads/')) {
      const localPath = join(process.cwd(), 'public', imageUrl)
      if (existsSync(localPath)) {
        const imageData = readFileSync(localPath)
        await writeFile(outputPath, imageData)
        return outputPath
      }
    }

    // If it's a data URL, decode it
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1]
      const imageData = Buffer.from(base64Data, 'base64')
      await writeFile(outputPath, imageData)
      return outputPath
    }

    // If it's a URL, fetch it
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(outputPath, buffer)
    return outputPath
  } catch (error) {
    throw new Error(`Failed to download character image: ${error}`)
  }
}

/**
 * Generate audio from script text
 */
async function generateScriptAudio(
  text: string,
  outputPath: string,
  tenantId: string
): Promise<string> {
  try {
    // Use text-to-speech API
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    
    // Get tenant's API token (simplified - in production, use proper auth)
    const response = await fetch(`${baseUrl}/api/ai/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, pass proper auth token
      },
      body: JSON.stringify({
        text,
        language: 'en',
        speed: 1.0,
      }),
    })

    if (!response.ok) {
      // Fallback: Use browser TTS or placeholder
      throw new Error('TTS service unavailable')
    }

    const data = await response.json()
    
    // Download audio if URL provided
    if (data.audioUrl) {
      const audioResponse = await fetch(data.audioUrl)
      const audioBuffer = await audioResponse.arrayBuffer()
      await writeFile(outputPath, Buffer.from(audioBuffer))
      return outputPath
    }

    throw new Error('No audio URL returned')
  } catch (error) {
    // Fallback: Create placeholder audio file
    console.warn('TTS failed, using placeholder:', error)
    // In production, you might want to use a different TTS service or browser TTS
    throw new Error('Audio generation failed - TTS service not configured')
  }
}

/**
 * Upload video to PayAid Drive
 */
async function uploadVideoToDrive(
  videoPath: string,
  tenantId: string,
  name: string,
  videoId: string
) {
  const videoData = readFileSync(videoPath)
  const stats = statSync(videoPath)
  
  // Save to uploads directory
  const fileName = `video-${videoId}-${Date.now()}.mp4`
  const uploadPath = join(
    process.cwd(),
    'uploads',
    tenantId,
    'ai-influencer',
    fileName
  )
  
  const uploadDir = join(uploadPath, '..')
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true })
  }
  
  await writeFile(uploadPath, videoData)
  
  // Create DriveFile record
  const driveFile = await prisma.driveFile.create({
    data: {
      tenantId,
      name,
      fileName: fileName,
      fileUrl: `/uploads/${tenantId}/ai-influencer/${fileName}`,
      fileSize: stats.size,
      mimeType: 'video/mp4',
      fileType: 'file',
      tags: ['ai-influencer', 'video'],
    },
  })

  return driveFile
}

