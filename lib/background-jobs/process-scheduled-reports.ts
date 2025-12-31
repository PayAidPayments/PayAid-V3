/**
 * Background job to process scheduled reports
 * Runs periodically to execute scheduled reports and send them via email
 */

import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/sendgrid'

/**
 * Process all scheduled reports that are due to run
 */
export async function processScheduledReports(tenantId?: string) {
  const now = new Date()
  
  const where: any = {
    isActive: true,
    nextRunAt: {
      lte: now,
    },
    scheduleConfig: {
      not: null,
    },
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  // Get all reports that are due
  const dueReports = await prisma.report.findMany({
    where,
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    take: 50, // Process in batches
  })

  console.log(`Processing ${dueReports.length} scheduled reports...`)

  let successCount = 0
  let failureCount = 0

  for (const report of dueReports) {
    try {
      // Create scheduled run record
      const scheduledRun = await prisma.scheduledReportRun.create({
        data: {
          tenantId: report.tenantId,
          reportId: report.id,
          status: 'PENDING',
          startedAt: new Date(),
          outputFormat: (report.scheduleConfig as any)?.outputFormat || 'PDF',
          recipients: (report.scheduleConfig as any)?.recipients || [],
        },
      })

      // Execute the report (generate data)
      const reportData = await executeReport(report)

      // Generate file (PDF, CSV, etc.)
      const fileUrl = await generateReportFile(report, reportData, scheduledRun.outputFormat)

      // Update scheduled run
      await prisma.scheduledReportRun.update({
        where: { id: scheduledRun.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          fileUrl,
        },
      })

      // Send email with report
      const recipients = (scheduledRun.recipients as string[]) || []
      if (recipients.length > 0) {
        await sendScheduledReportEmail(report, fileUrl, recipients)
      }

      // Calculate next run time
      const nextRunAt = calculateNextRunTime(report.scheduleConfig as any)

      // Update report with next run time
      await prisma.report.update({
        where: { id: report.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt,
        },
      })

      successCount++
      console.log(`✅ Processed report: ${report.name}`)
    } catch (error) {
      console.error(`❌ Failed to process report ${report.name}:`, error)
      
      // Mark as failed
      await prisma.scheduledReportRun.create({
        data: {
          tenantId: report.tenantId,
          reportId: report.id,
          status: 'FAILED',
          startedAt: new Date(),
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      failureCount++
    }
  }

  console.log(
    `Report processing complete: ${successCount} succeeded, ${failureCount} failed`
  )

  return {
    total: dueReports.length,
    success: successCount,
    failures: failureCount,
  }
}

/**
 * Execute a report and return the data
 */
async function executeReport(report: any): Promise<any[]> {
  const config = report.config as any
  const { dataSource, filters, columns, grouping, sorting } = config

  // This is a simplified version - in production, you'd query the actual data sources
  // based on the dataSource field (contacts, deals, invoices, orders, expenses)
  
  let data: any[] = []

  switch (dataSource) {
    case 'contacts':
      data = await prisma.contact.findMany({
        where: {
          tenantId: report.tenantId,
          ...(filters || {}),
        },
        select: columns?.reduce((acc: any, col: string) => {
          acc[col] = true
          return acc
        }, {}),
        take: 1000,
      })
      break
    case 'deals':
      data = await prisma.deal.findMany({
        where: {
          tenantId: report.tenantId,
          ...(filters || {}),
        },
        select: columns?.reduce((acc: any, col: string) => {
          acc[col] = true
          return acc
        }, {}),
        take: 1000,
      })
      break
    case 'invoices':
      data = await prisma.invoice.findMany({
        where: {
          tenantId: report.tenantId,
          ...(filters || {}),
        },
        select: columns?.reduce((acc: any, col: string) => {
          acc[col] = true
          return acc
        }, {}),
        take: 1000,
      })
      break
    // Add more data sources as needed
    default:
      data = []
  }

  // Apply grouping and sorting if specified
  if (grouping) {
    // Group data (simplified)
  }

  if (sorting) {
    // Sort data (simplified)
  }

  return data
}

/**
 * Generate report file (PDF, CSV, Excel)
 */
async function generateReportFile(
  report: any,
  data: any[],
  format: string
): Promise<string> {
  // For now, return a placeholder URL
  // In production, you'd use libraries like:
  // - PDF: pdfkit, puppeteer
  // - CSV: csv-writer
  // - Excel: exceljs
  
  const fileName = `${report.name}-${Date.now()}.${format.toLowerCase()}`
  
  // TODO: Implement actual file generation and upload to storage (S3, etc.)
  // For now, return a placeholder
  return `/reports/${fileName}`
}

/**
 * Send scheduled report via email
 */
async function sendScheduledReportEmail(
  report: any,
  fileUrl: string,
  recipients: string[]
) {
  try {
    const subject = `Scheduled Report: ${report.name}`
    const html = `
      <h2>Scheduled Report: ${report.name}</h2>
      <p>Your scheduled report is ready.</p>
      <p><a href="${fileUrl}">Download Report</a></p>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    `

    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject,
        html,
      })
    }
  } catch (error) {
    console.error('Failed to send scheduled report email:', error)
    throw error
  }
}

/**
 * Calculate next run time based on schedule config
 */
function calculateNextRunTime(scheduleConfig: any): Date {
  const now = new Date()
  const { frequency, dayOfWeek, dayOfMonth, time } = scheduleConfig

  let nextRun = new Date(now)

  if (frequency === 'daily') {
    nextRun.setDate(now.getDate() + 1)
    if (time) {
      const [hours, minutes] = time.split(':')
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  } else if (frequency === 'weekly') {
    const targetDay = dayOfWeek || 1 // Monday by default
    const currentDay = now.getDay()
    const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
    nextRun.setDate(now.getDate() + daysUntilTarget)
    if (time) {
      const [hours, minutes] = time.split(':')
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  } else if (frequency === 'monthly') {
    const targetDay = dayOfMonth || 1
    nextRun.setMonth(now.getMonth() + 1)
    nextRun.setDate(targetDay)
    if (time) {
      const [hours, minutes] = time.split(':')
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  }

  return nextRun
}

