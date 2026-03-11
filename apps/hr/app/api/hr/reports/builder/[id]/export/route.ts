import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { generateReportData } from '@/lib/hr/report-generator'
import * as XLSX from 'xlsx'

/**
 * GET /api/hr/reports/builder/[id]/export?format=csv|json|xlsx|pdf
 * Generate report and return as CSV, Excel, JSON, or PDF (HTML for Print to PDF).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()

    const result = await generateReportData(id, tenantId)
    if (!result) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    let rows = result.data
    if (!Array.isArray(rows)) rows = []
    if (rows.length > 0 && rows[0]?.data) {
      rows = rows.flatMap((g: any) => (Array.isArray(g.data) ? g.data : [g]))
    }

    const safeName = result.reportName.replace(/[^a-z0-9_-]/gi, '_')

    if (format === 'csv') {
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []
      const escape = (v: any) => {
        if (v == null) return ''
        const s = String(v)
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
        return s
      }
      const header = columns.map(escape).join(',')
      const body = rows.map((row: any) => columns.map((col) => escape(row[col])).join(',')).join('\n')
      const csv = '\uFEFF' + header + '\n' + body

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}.csv"`,
        },
      })
    }

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
        },
      })
    }

    if (format === 'pdf') {
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []
      const ths = columns.map((c) => `<th>${String(c).replace(/</g, '&lt;')}</th>`).join('')
      const trs = rows
        .map(
          (row: any) =>
            '<tr>' +
            columns.map((col) => `<td>${row[col] != null ? String(row[col]).replace(/</g, '&lt;') : ''}</td>`).join('') +
            '</tr>'
        )
        .join('')
      const html =
        `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${result.reportName}</title>` +
        `<style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:6px}th{background:#eee}</style></head>` +
        `<body><h1>${result.reportName}</h1><p>Generated: ${new Date().toISOString()}</p><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></body></html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${safeName}.html"`,
        },
      })
    }

    return NextResponse.json({
      data: rows,
      summary: result.summary,
      reportName: result.reportName,
      exportedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
