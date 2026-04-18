import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { parseExcelToRows } from '@/lib/utils/parseExcel'
import Papa from 'papaparse'
import { processInboundLead } from '@/lib/crm/inbound-orchestration'

const leadRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  value: z.number().optional(),
  notes: z.string().optional().or(z.literal('')),
})

// POST /api/leads/import - Bulk import leads from CSV/XLSX
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sourceId = formData.get('sourceId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let rows: any[] = []

    if (fileName.endsWith('.csv')) {
      const text = await file.text()
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
      })
      rows = result.data as any[]
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer()
      const rawRows = await parseExcelToRows(arrayBuffer)
      rows = rawRows.map((row: any) => {
        const normalized: any = {}
        for (const key in row) {
          normalized[String(key).trim().toLowerCase()] = row[key]
        }
        return normalized
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload CSV or XLSX file.' },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty or has no valid data' }, { status: 400 })
    }

    let leadSourceId = sourceId
    if (!leadSourceId) {
      const defaultSource = await prisma.leadSource.findFirst({
        where: { tenantId, name: 'Bulk Import' },
      })
      if (defaultSource) {
        leadSourceId = defaultSource.id
      } else {
        const newSource = await prisma.leadSource.create({
          data: { name: 'Bulk Import', type: 'direct', tenantId },
        })
        leadSourceId = newSource.id
      }
    }

    const leadsToImport: Array<z.infer<typeof leadRowSchema> & { rowNumber: number }> = []
    const errors: Array<{ row: number; error: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const validated = leadRowSchema.parse({
          name: row.name || row['full name'] || row['contact name'] || 'Unknown',
          email: row.email || '',
          phone: row.phone || row.mobile || '',
          company: row.company || row['company name'] || '',
          source: row.source || '',
          value: row.value || row.amount || row['deal value'] || undefined,
          notes: row.notes || row.description || '',
        })
        leadsToImport.push({ ...validated, rowNumber: i + 1 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: i + 1,
            error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
          })
        } else {
          errors.push({ row: i + 1, error: 'Unknown error' })
        }
      }
    }

    const created: Array<{ id: string; name: string }> = []
    let skipped = 0

    const skipExecutionLogWrite = leadsToImport.length > 80

    for (const row of leadsToImport) {
      try {
        const inbound = await processInboundLead({
          tenantId,
          actorUserId: userId,
          dedupePolicy: 'reject_duplicate',
          source: {
            sourceChannel: 'bulk_import',
            sourceSubchannel: 'leads_csv',
            sourceRef: leadSourceId ?? undefined,
            rawMetadata: { row: row.rowNumber, leadSourceId },
          },
          contact: {
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            company: row.company || null,
            type: 'lead',
            stage: 'prospect',
            status: 'active',
            notes: row.notes || null,
          },
          legacySourceLabel: row.source || 'Bulk Import',
          skipWorkflows: true,
          skipExecutionLogWrite,
          skipLeadRouting: true,
        })

        if (!inbound.ok && inbound.error?.code === 'DUPLICATE_EMAIL') {
          skipped++
          continue
        }
        if (!inbound.ok && inbound.error?.code === 'DUPLICATE_PHONE') {
          skipped++
          continue
        }
        if (!inbound.ok) {
          errors.push({
            row: row.rowNumber,
            error: inbound.error?.message || 'Failed to import lead',
          })
          continue
        }

        if (row.value != null && row.value > 0) {
          await prisma.deal.create({
            data: {
              name: `Deal for ${row.name}`,
              value: row.value,
              probability: 10,
              stage: 'lead',
              tenantId,
              contactId: inbound.contact.id,
            },
          })
        }

        created.push({ id: inbound.contact.id, name: inbound.contact.name })
      } catch (error: any) {
        errors.push({
          row: row.rowNumber,
          error: error?.message || 'Failed to create lead',
        })
      }
    }

    return NextResponse.json({
      success: true,
      imported: created.length,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: rows.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Bulk import leads error:', error)
    return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 })
  }
}
