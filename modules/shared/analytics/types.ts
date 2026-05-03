/**
 * Analytics & Reporting Module Types - Base Module
 * Shared across all industries
 */

import { z } from 'zod'

import { BUSINESS_GRAPH_MODULES, EntityIdSchema } from '../business-graph'

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

export const DashboardWidgetSchema = z.object({
  id: EntityIdSchema,
  organizationId: EntityIdSchema,
  dashboardId: EntityIdSchema,
  widgetType: z.enum(['metric', 'chart', 'table', 'gauge', 'heatmap']),
  title: z.string().min(1),
  dataSource: z.object({
    module: z.enum(BUSINESS_GRAPH_MODULES),
    metric: z.string().min(1),
    filters: z.record(z.unknown()).optional(),
    dateRange: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']),
  }),
  displayOptions: z
    .object({
      chartType: z.enum(['line', 'bar', 'pie', 'area']).optional(),
      currencyDisplay: z.literal('INR'),
      compareWith: z.enum(['previous_period', 'previous_year']).optional(),
    })
    .optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
  refreshInterval: z.number().int().positive().optional(),
})
