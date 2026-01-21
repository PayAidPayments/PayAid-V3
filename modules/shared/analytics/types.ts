/**
 * Analytics & Reporting Module Types - Base Module
 * Shared across all industries
 */

import { z } from 'zod'

export type WidgetType = 'metric' | 'chart' | 'table' | 'gauge' | 'heatmap'
export type ChartType = 'line' | 'bar' | 'pie' | 'area'
export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
export type ReportType = 'financial' | 'sales' | 'operational' | 'compliance' | 'custom'

export interface DashboardWidget {
  id: string
  organizationId: string
  dashboardId: string
  widgetType: WidgetType
  title: string
  dataSource: {
    module: string
    metric: string
    filters?: Record<string, unknown>
    dateRange: DateRange
  }
  displayOptions?: {
    chartType?: ChartType
    currencyDisplay: 'INR'
    compareWith?: 'previous_period' | 'previous_year'
  }
  position: { x: number; y: number }
  size: { width: number; height: number }
  refreshInterval?: number
}

export interface Report {
  id: string
  organizationId: string
  reportName: string
  reportType: ReportType
  createdBy: string
  generatedAt: Date
  dateRange: { startDate: Date; endDate: Date }
  sections: ReportSection[]
  exportFormats: Array<'pdf' | 'xlsx' | 'csv'>
  scheduledGeneration?: {
    frequency: 'weekly' | 'monthly' | 'quarterly'
    recipients: string[]
  }
}

export interface ReportSection {
  id: string
  title: string
  data: unknown[]
  chartType?: ChartType
}
