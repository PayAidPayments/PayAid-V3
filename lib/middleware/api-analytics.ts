/**
 * API Analytics Middleware
 * Tracks API usage per tenant and API key
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export interface APIUsageMetrics {
  tenantId?: string
  apiKeyId?: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: Date
}

/**
 * Track API usage
 */
export async function trackAPIUsage(metrics: APIUsageMetrics): Promise<void> {
  try {
    // Store in database for analytics
    await prisma.apiUsageLog.create({
      data: {
        tenantId: metrics.tenantId,
        apiKeyId: metrics.apiKeyId,
        endpoint: metrics.endpoint,
        method: metrics.method,
        statusCode: metrics.statusCode,
        responseTime: metrics.responseTime,
        timestamp: metrics.timestamp,
      },
    })
  } catch (error) {
    // Don't fail the request if analytics tracking fails
    console.error('Failed to track API usage:', error)
  }
}

/**
 * Get API usage statistics for a tenant
 */
export async function getAPIUsageStats(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { tenantId }
  
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  const [totalRequests, successfulRequests, failedRequests, avgResponseTime] = await Promise.all([
    prisma.apiUsageLog.count({ where }),
    prisma.apiUsageLog.count({ where: { ...where, statusCode: { gte: 200, lt: 300 } } }),
    prisma.apiUsageLog.count({ where: { ...where, statusCode: { gte: 400 } } }),
    prisma.apiUsageLog.aggregate({
      where,
      _avg: { responseTime: true },
    }),
  ])

  // Get top endpoints
  const topEndpoints = await prisma.apiUsageLog.groupBy({
    by: ['endpoint'],
    where,
    _count: { endpoint: true },
    orderBy: { _count: { endpoint: 'desc' } },
    take: 10,
  })

  // Get status code distribution
  const statusCodeDistribution = await prisma.apiUsageLog.groupBy({
    by: ['statusCode'],
    where,
    _count: { statusCode: true },
  })

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: avgResponseTime._avg.responseTime || 0,
    topEndpoints: topEndpoints.map((e) => ({
      endpoint: e.endpoint,
      count: e._count.endpoint,
    })),
    statusCodeDistribution: statusCodeDistribution.map((s) => ({
      statusCode: s.statusCode,
      count: s._count.statusCode,
    })),
  }
}

/**
 * Get API usage statistics for an API key
 */
export async function getAPIKeyUsageStats(
  apiKeyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { apiKeyId }
  
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  const stats = await getAPIUsageStats('', startDate, endDate)
  
  // Override with API key specific query
  const [totalRequests, successfulRequests, failedRequests, avgResponseTime] = await Promise.all([
    prisma.apiUsageLog.count({ where }),
    prisma.apiUsageLog.count({ where: { ...where, statusCode: { gte: 200, lt: 300 } } }),
    prisma.apiUsageLog.count({ where: { ...where, statusCode: { gte: 400 } } }),
    prisma.apiUsageLog.aggregate({
      where,
      _avg: { responseTime: true },
    }),
  ])

  return {
    ...stats,
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: avgResponseTime._avg.responseTime || 0,
  }
}

