import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { PDFDocument } from 'pdf-lib'

/**
 * POST /api/pdf/merge
 * Merge multiple PDF files into one
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files: File[] = []
    
    // Extract all PDF files from form data
    let index = 0
    while (formData.has(`file${index}`)) {
      const file = formData.get(`file${index}`) as File
      if (file && file.type === 'application/pdf') {
        files.push(file)
      }
      index++
    }

    if (files.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 PDF files are required for merging' },
        { status: 400 }
      )
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create()

    // Merge all PDFs
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach((page) => mergedPdf.addPage(page))
    }

    // Generate the merged PDF as bytes
    const pdfBytes = await mergedPdf.save()

    // Return the merged PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="merged.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF merge error:', error)
    return NextResponse.json(
      { error: 'Failed to merge PDFs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

