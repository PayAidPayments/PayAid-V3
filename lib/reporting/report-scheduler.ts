/**
 * Report Scheduler Service
 * Schedules automated report delivery
 */

import { prisma } from '@/lib/db/prisma'
import { ReportEngineService } from './report-engine'
import { ReportExportsService } from './report-exports'

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

export class ReportSchedulerService {
  /**
   * Enable scheduling for a report
   */
  static async enableScheduling(
    tenantId: string,
    reportId: string,
    config: {
      frequency: ScheduleFrequency
      day?: number // Day of week (0-6) or day of month (1-31)
      time: string // HH:mm format
      recipients: string[] // Email addresses
      exportFormat: 'pdf' | 'excel' | 'csv'
    }
  ) {
    const report = await prisma.customReport.findFirst({
      where: { id: reportId, tenantId },
    })

    if (!report) {
      throw new Error('Report not found')
    }

    return prisma.customReport.update({
      where: { id: reportId },
      data: {
        scheduleEnabled: true,
        scheduleFrequency: config.frequency,
        scheduleDay: config.day,
        scheduleTime: config.time,
        recipients: config.recipients as any,
        exportFormats: [config.exportFormat] as any,
      },
    })
  }

  /**
   * Disable scheduling for a report
   */
  static async disableScheduling(tenantId: string, reportId: string) {
    const report = await prisma.customReport.findFirst({
      where: { id: reportId, tenantId },
    })

    if (!report) {
      throw new Error('Report not found')
    }

    return prisma.customReport.update({
      where: { id: reportId },
      data: {
        scheduleEnabled: false,
      },
    })
  }

  /**
   * Process scheduled reports (called by cron job)
   */
  static async processScheduledReports() {
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
    const currentDate = now.getDate()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Find reports that should run now
    const reports = await prisma.customReport.findMany({
      where: {
        scheduleEnabled: true,
      },
    })

    const reportsToRun = reports.filter((report) => {
      const frequency = report.scheduleFrequency as ScheduleFrequency
      const scheduleTime = report.scheduleTime || '09:00'
      const scheduleDay = report.scheduleDay

      // Check if time matches
      if (scheduleTime !== currentTime) {
        return false
      }

      // Check frequency and day
      if (frequency === 'daily') {
        return true
      } else if (frequency === 'weekly' && scheduleDay !== null) {
        return currentDay === scheduleDay
      } else if (frequency === 'monthly' && scheduleDay !== null) {
        return currentDate === scheduleDay
      }

      return false
    })

    // Execute and send reports
    for (const report of reportsToRun) {
      try {
        await this.executeAndSendReport(report)
      } catch (error) {
        console.error(`Error processing scheduled report ${report.id}:`, error)
      }
    }

    return {
      processed: reportsToRun.length,
      reports: reportsToRun.map((r) => r.id),
    }
  }

  /**
   * Execute and send scheduled report
   */
  private static async executeAndSendReport(report: any) {
    // Create scheduled run record
    const run = await prisma.scheduledReportRun.create({
      data: {
        tenantId: report.tenantId,
        reportId: report.id,
        status: 'PENDING',
        startedAt: new Date(),
        outputFormat: (report.exportFormats as string[])?.[0]?.toUpperCase() || 'PDF',
        recipients: report.recipients,
      },
    })

    try {
      // Execute report
      const config = {
        dataSource: report.reportType as any,
        filters: (report.filters as any) || [],
        columns: (report.columns as any) || [],
        grouping: (report.grouping as any),
        sorting: (report.sorting as any),
      }

      const results = await ReportEngineService.executeReport(report.tenantId, config)

      // Export report
      const exportFormat = (report.exportFormats as string[])?.[0] || 'pdf'
      const fileUrl = await ReportExportsService.exportReport(
        report.tenantId,
        report.id,
        results,
        exportFormat as 'pdf' | 'excel' | 'csv'
      )

      // Update run status
      await prisma.scheduledReportRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          fileUrl,
        },
      })

      // Send email with report (TODO: Integrate with email service)
      // await sendReportEmail(report.recipients, fileUrl, report.name)

      return { success: true, runId: run.id, fileUrl }
    } catch (error) {
      // Update run with error
      await prisma.scheduledReportRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  }
}
