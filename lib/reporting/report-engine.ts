/**
 * Report Engine Service
 * Executes custom reports and generates data
 */

import { prisma } from '@/lib/db/prisma'

export type DataSource = 'contacts' | 'deals' | 'tasks' | 'invoices' | 'orders' | 'expenses'

export interface ReportFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
}

export interface ReportColumn {
  field: string
  label: string
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface ReportConfig {
  dataSource: DataSource
  filters: ReportFilter[]
  columns: ReportColumn[]
  grouping?: string[]
  sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
}

export class ReportEngineService {
  /**
   * Execute custom report
   */
  static async executeReport(tenantId: string, config: ReportConfig) {
    let query: any = {}

    // Apply filters
    for (const filter of config.filters) {
      query = this.applyFilter(query, filter, config.dataSource)
    }

    // Build query based on data source
    switch (config.dataSource) {
      case 'contacts':
        return this.executeContactReport(tenantId, query, config)
      case 'deals':
        return this.executeDealReport(tenantId, query, config)
      case 'tasks':
        return this.executeTaskReport(tenantId, query, config)
      case 'invoices':
        return this.executeInvoiceReport(tenantId, query, config)
      case 'orders':
        return this.executeOrderReport(tenantId, query, config)
      case 'expenses':
        return this.executeExpenseReport(tenantId, query, config)
      default:
        throw new Error(`Unsupported data source: ${config.dataSource}`)
    }
  }

  /**
   * Apply filter to query
   */
  private static applyFilter(query: any, filter: ReportFilter, dataSource: DataSource): any {
    const fieldMap: Record<string, string> = {
      contacts: filter.field,
      deals: filter.field,
      tasks: filter.field,
      invoices: filter.field,
      orders: filter.field,
      expenses: filter.field,
    }

    const field = fieldMap[dataSource] || filter.field

    switch (filter.operator) {
      case 'equals':
        return { ...query, [field]: filter.value }
      case 'not_equals':
        return { ...query, [field]: { not: filter.value } }
      case 'contains':
        return { ...query, [field]: { contains: filter.value, mode: 'insensitive' } }
      case 'greater_than':
        return { ...query, [field]: { gt: filter.value } }
      case 'less_than':
        return { ...query, [field]: { lt: filter.value } }
      case 'between':
        return { ...query, [field]: { gte: filter.value[0], lte: filter.value[1] } }
      case 'in':
        return { ...query, [field]: { in: filter.value } }
      case 'not_in':
        return { ...query, [field]: { notIn: filter.value } }
      default:
        return query
    }
  }

  /**
   * Execute contact report
   */
  private static async executeContactReport(
    tenantId: string,
    query: any,
    config: ReportConfig
  ) {
    const where = {
      tenantId,
      ...query,
    }

    const contacts = await prisma.contact.findMany({
      where,
      select: this.buildSelect(config.columns, 'contacts'),
      orderBy: config.sorting?.map((s) => ({ [s.field]: s.direction })) || { createdAt: 'desc' },
      take: config.limit || 1000,
    })

    return this.processResults(contacts, config)
  }

  /**
   * Execute deal report
   */
  private static async executeDealReport(
    tenantId: string,
    query: any,
    config: ReportConfig
  ) {
    const where = {
      tenantId,
      ...query,
    }

    const deals = await prisma.deal.findMany({
      where,
      select: this.buildSelect(config.columns, 'deals'),
      orderBy: config.sorting?.map((s) => ({ [s.field]: s.direction })) || { createdAt: 'desc' },
      take: config.limit || 1000,
    })

    return this.processResults(deals, config)
  }

  /**
   * Execute task report
   */
  private static async executeTaskReport(
    tenantId: string,
    query: any,
    config: ReportConfig
  ) {
    const where = {
      tenantId,
      ...query,
    }

    const tasks = await prisma.task.findMany({
      where,
      select: this.buildSelect(config.columns, 'tasks'),
      orderBy: config.sorting?.map((s) => ({ [s.field]: s.direction })) || { createdAt: 'desc' },
      take: config.limit || 1000,
    })

    return this.processResults(tasks, config)
  }

  /**
   * Execute invoice report
   */
  private static async executeInvoiceReport(
    tenantId: string,
    query: any,
    config: ReportConfig
  ) {
    const where = {
      tenantId,
      ...query,
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: this.buildSelect(config.columns, 'invoices'),
      orderBy: config.sorting?.map((s) => ({ [s.field]: s.direction })) || { createdAt: 'desc' },
      take: config.limit || 1000,
    })

    return this.processResults(invoices, config)
  }

  /**
   * Execute order report
   */
  private static async executeOrderReport(
    tenantId: string,
    query: any,
    config: ReportConfig
  ) {
    const where = {
      tenantId,
      ...query,
    }

    const orders = await prisma.order.findMany({
      where,
      select: this.buildSelect(config.columns, 'orders'),
      orderBy: config.sorting?.map((s) => ({ [s.field]: s.direction })) || { createdAt: 'desc' },
      take: config.limit || 1000,
    })

    return this.processResults(orders, config)
  }

  /**
   * Execute expense report
   */
  private static async executeExpenseReport(
    tenantId: string,
    query: any,
    config: ReportConfig
  ) {
    const where = {
      tenantId,
      ...query,
    }

    const expenses = await prisma.expense.findMany({
      where,
      select: this.buildSelect(config.columns, 'expenses'),
      orderBy: config.sorting?.map((s) => ({ [s.field]: s.direction })) || { createdAt: 'desc' },
      take: config.limit || 1000,
    })

    return this.processResults(expenses, config)
  }

  /**
   * Build select object from columns
   */
  private static buildSelect(columns: ReportColumn[], dataSource: DataSource): any {
    const select: any = {}
    for (const col of columns) {
      select[col.field] = true
    }
    return select
  }

  /**
   * Process results with grouping and aggregation
   */
  private static processResults(results: any[], config: ReportConfig) {
    // Apply grouping if specified
    if (config.grouping && config.grouping.length > 0) {
      return this.groupResults(results, config.grouping, config.columns)
    }

    // Apply aggregation if specified
    const aggregated = this.aggregateResults(results, config.columns)

    return {
      data: results,
      summary: aggregated,
      total: results.length,
    }
  }

  /**
   * Group results
   */
  private static groupResults(results: any[], grouping: string[], columns: ReportColumn[]) {
    const groups = new Map<string, any[]>()

    for (const result of results) {
      const key = grouping.map((g) => result[g] || 'null').join('|')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(result)
    }

    const groupedData = Array.from(groups.entries()).map(([key, items]) => {
      const values = key.split('|')
      const group: any = {}
      grouping.forEach((g, i) => {
        group[g] = values[i] === 'null' ? null : values[i]
      })

      // Calculate aggregates for each group
      const aggregates: any = {}
      for (const col of columns) {
        if (col.aggregate) {
          aggregates[col.field] = this.calculateAggregate(items, col.field, col.aggregate)
        }
      }

      return {
        ...group,
        ...aggregates,
        count: items.length,
        items,
      }
    })

    return {
      data: groupedData,
      total: results.length,
      groups: groupedData.length,
    }
  }

  /**
   * Aggregate results
   */
  private static aggregateResults(results: any[], columns: ReportColumn[]) {
    const summary: any = {}

    for (const col of columns) {
      if (col.aggregate) {
        summary[col.field] = this.calculateAggregate(results, col.field, col.aggregate)
      }
    }

    return summary
  }

  /**
   * Calculate aggregate
   */
  private static calculateAggregate(
    results: any[],
    field: string,
    aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): number {
    const values = results.map((r) => r[field]).filter((v) => v != null && !isNaN(Number(v)))

    switch (aggregate) {
      case 'sum':
        return values.reduce((sum, v) => sum + Number(v), 0)
      case 'avg':
        return values.length > 0 ? values.reduce((sum, v) => sum + Number(v), 0) / values.length : 0
      case 'count':
        return values.length
      case 'min':
        return values.length > 0 ? Math.min(...values.map(Number)) : 0
      case 'max':
        return values.length > 0 ? Math.max(...values.map(Number)) : 0
      default:
        return 0
    }
  }
}
