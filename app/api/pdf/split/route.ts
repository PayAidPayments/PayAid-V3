import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { PDFDocument } from 'pdf-lib'

/**
 * POST /api/pdf/split
 * Split PDF by pages or ranges
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string || 'pages'
    const pages = formData.get('pages') as string
    const splitMode = formData.get('splitMode') as string || 'single' // 'single' or 'multiple'

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const sourcePdf = await PDFDocument.load(arrayBuffer)
    const totalPages = sourcePdf.getPageCount()

    if (splitMode === 'single') {
      // Return a single PDF with selected pages
      if (!pages) {
        return NextResponse.json(
          { error: 'Page numbers or ranges are required' },
          { status: 400 }
        )
      }

      // Parse page numbers/ranges (convert to 0-based index)
      const pageIndices: number[] = []
      const parts = pages.split(',')
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          for (let i = start; i <= end; i++) {
            const index = i - 1 // Convert to 0-based
            if (index >= 0 && index < totalPages) {
              pageIndices.push(index)
            }
          }
        } else {
          const index = Number(part) - 1 // Convert to 0-based
          if (index >= 0 && index < totalPages) {
            pageIndices.push(index)
          }
        }
      }

      if (pageIndices.length === 0) {
        return NextResponse.json(
          { error: 'No valid pages selected' },
          { status: 400 }
        )
      }

      // Create new PDF with selected pages
      const newPdf = await PDFDocument.create()
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="split.pdf"',
        },
      })
    } else {
      // Return multiple PDFs (one per page or range)
      // For now, return the first page as a ZIP would require additional libraries
      // This can be enhanced later to return a ZIP file with multiple PDFs
      return NextResponse.json(
        { 
          error: 'Multiple file split requires ZIP generation. Use single mode for now.',
          message: 'Multiple file split will be implemented in a future update'
        },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('PDF split error:', error)
    return NextResponse.json(
      { error: 'Failed to split PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

