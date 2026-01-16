import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const generateCharacterSchema = z.object({
  industry: z.string().optional(),
  gender: z.string().optional(),
  ageRange: z.string().optional(),
  campaignId: z.string().optional(),
})

/**
 * POST /api/ai-influencer/characters/generate
 * Generate AI influencer character using Google AI Studio or Hugging Face
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId || !payload.userId) {
      return NextResponse.json(
        { error: 'Tenant or user not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = generateCharacterSchema.parse(body)

    // Build character prompt
    const gender = validated.gender || 'female'
    const ageRange = validated.ageRange || '25-35'
    const industry = validated.industry || 'general'
    
    const prompt = `Generate a professional headshot portrait of a ${ageRange} year old ${gender} influencer character for ${industry} industry. 
    The character should look friendly, approachable, and professional. 
    High quality, realistic, professional photography style, studio lighting, clean background, 
    looking directly at camera with a warm smile. 
    Portrait orientation, close-up shot, professional headshot style.`

    // Try to generate image using existing AI image generation endpoint
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    const imageResponse = await fetch(`${baseUrl}/api/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        prompt,
        style: 'realistic',
        size: '1024x1024',
      }),
    })

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: 'Failed to generate character image',
          message: errorData.message || errorData.error || 'Image generation failed',
          hint: errorData.hint || 'Please check your AI integration settings',
        },
        { status: imageResponse.status }
      )
    }

    const imageData = await imageResponse.json()
    const imageUrl = imageData.imageUrl

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL returned from image generation service' },
        { status: 500 }
      )
    }

    // Save image to PayAid Drive
    let driveFileId: string | null = null
    let savedImageUrl: string | null = null

    try {
      // Convert data URL to buffer if needed
      let imageBuffer: Buffer
      if (imageUrl.startsWith('data:')) {
        // Extract base64 data
        const base64Data = imageUrl.split(',')[1]
        imageBuffer = Buffer.from(base64Data, 'base64')
      } else {
        // Fetch image from URL
        const imageResponse = await fetch(imageUrl)
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'uploads', payload.tenantId, 'ai-influencer')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Save file
      const fileName = `character-${Date.now()}.png`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, imageBuffer)

      // Create file record in Drive
      const driveFile = await prisma.driveFile.create({
        data: {
          tenantId: payload.tenantId,
          name: `AI Influencer Character - ${industry}`,
          fileName: fileName,
          fileUrl: `/uploads/${payload.tenantId}/ai-influencer/${fileName}`,
          fileSize: imageBuffer.length,
          mimeType: 'image/png',
          fileType: 'file',
          parentId: null,
          createdById: payload.userId,
          updatedById: payload.userId,
          tags: ['ai-influencer', 'character', industry],
        },
      })

      driveFileId = driveFile.id
      savedImageUrl = driveFile.fileUrl
    } catch (driveError) {
      console.error('Failed to save to Drive, using direct URL:', driveError)
      // Fallback to direct URL if Drive save fails
      savedImageUrl = imageUrl
    }

    // Create character record
    const character = await prisma.aIInfluencerCharacter.create({
      data: {
        tenantId: payload.tenantId,
        campaignId: validated.campaignId || null,
        name: `${gender} ${ageRange} - ${industry}`,
        industry: industry,
        gender: gender,
        ageRange: ageRange,
        imageUrl: savedImageUrl || imageUrl,
        driveFileId: driveFileId,
        generatedPrompt: prompt,
        usageCount: 0,
      },
    })

    return NextResponse.json({
      character: {
        id: character.id,
        name: character.name,
        industry: character.industry,
        gender: character.gender,
        ageRange: character.ageRange,
        imageUrl: character.imageUrl,
        driveFileId: character.driveFileId,
      },
      variations: [], // Can generate multiple variations later
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Character generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate character',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

