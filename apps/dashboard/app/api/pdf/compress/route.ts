import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { PDFDocument } from 'pdf-lib'

/**
 * POST /api/pdf/compress
 * Compress PDF to reduce file size
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const level = formData.get('level') as string || 'medium'

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    // Compression options based on level
    const compressionOptions: { 
      useObjectStreams?: boolean
      compressEmbeddedFonts?: boolean
    } = {}

    switch (level) {
      case 'low':
        // Minimal compression
        compressionOptions.useObjectStreams = true
        break
      case 'medium':
        // Moderate compression (default)
        compressionOptions.useObjectStreams = true
        compressionOptions.compressEmbeddedFonts = true
        break
      case 'high':
        // Maximum compression
        compressionOptions.useObjectStreams = true
        compressionOptions.compressEmbeddedFonts = true
        break
    }

    // Save with compression options
    // Note: pdf-lib has limited compression capabilities
    // For advanced compression, consider using external services
    const pdfBytes = await pdf.save({
      useObjectStreams: compressionOptions.useObjectStreams,
    })

    const originalSize = file.size
    const compressedSize = pdfBytes.length
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2)

    // Return compressed PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="compressed.pdf"',
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': `${compressionRatio}%`,
      },
    })
  } catch (error) {
    console.error('PDF compress error:', error)
    return NextResponse.json(
      { error: 'Failed to compress PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

