import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'

// POST /api/upload/kyc - Upload KYC document
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return NextResponse.json(
        { error: 'File and type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // TODO: Upload to Cloudflare R2 or similar storage
    // For now, return a placeholder URL
    // In production, implement actual file upload:
    // 1. Generate unique filename
    // 2. Upload to Cloudflare R2
    // 3. Store URL in database (would need KYC model)
    // 4. Return the URL

    const fileName = `${user.tenantId}/${type}/${Date.now()}-${file.name}`
    const placeholderUrl = `https://storage.example.com/kyc/${fileName}`

    // Note: In production, you would:
    // - Upload to Cloudflare R2 using @aws-sdk/client-s3
    // - Store document metadata in database
    // - Return actual uploaded URL

    return NextResponse.json({
      success: true,
      url: placeholderUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('KYC upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
