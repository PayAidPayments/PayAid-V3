/**
 * PayAid Document Builder – generate docs from templates + CRM/Finance data.
 * Can be wired to ONLYOFFICE Document Builder API or local generation (docx/pdf-lib).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyProductivityProxyToken } from '@/lib/productivity/verify-proxy-token'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantId = body.tenantId as string
    const templateId = body.templateId as string
    const contactId = body.contactId as string | undefined
    const invoiceId = body.invoiceId as string | undefined

    if (!tenantId || !templateId) {
      return NextResponse.json({ error: 'tenantId and templateId required' }, { status: 400 })
    }

    verifyProductivityProxyToken(request, tenantId)

    const builderUrl = process.env.DOCUMENT_BUILDER_URL
    if (!builderUrl) {
      return NextResponse.json({
        message: 'Document Builder not configured. Set DOCUMENT_BUILDER_URL to your ONLYOFFICE Document Builder or builder service.',
        fileId: null,
        downloadUrl: null,
      })
    }

    // TODO: Call Document Builder API with templateId, contactId, invoiceId;
    // fetch contact/invoice from DB, build JSON, POST to builder, return fileId or signed download URL.
    // Example: POST builderUrl/build { templateId, data: { contact: {...}, invoice: {...} } }
    return NextResponse.json({
      message: 'Document Builder endpoint configured; integration pending.',
      fileId: null,
      downloadUrl: null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
