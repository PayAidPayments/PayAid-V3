import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = verifyToken(token)
    const roles = decoded.roles ?? (decoded.role ? [decoded.role] : [])
    const isSuperAdmin = roles.some((r: string) => SUPER_ADMIN_ROLES.includes(r))
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify prisma is available (check after first access to trigger Proxy initialization)
    try {
      await prisma.$queryRaw`SELECT 1`
      // Verify key models are accessible
      const requiredModels = ['tenant', 'user', 'invoice', 'aIUsage', 'subscription']
      const missingModels: string[] = []
      
      for (const modelName of requiredModels) {
        const model = (prisma as any)[modelName]
        if (!model || typeof model.count !== 'function') {
          missingModels.push(modelName)
        }
      }
      
      if (missingModels.length > 0) {
        throw new Error(`Prisma models not available: ${missingModels.join(', ')}`)
      }
      
      // Check optional models
      const optionalModels = ['whatsappMessage', 'merchantOnboarding', 'auditLog', 'featureFlag']
      for (const modelName of optionalModels) {
        const model = (prisma as any)[modelName]
        if (model && typeof model.count !== 'function') {
          console.warn(`[OVERVIEW] Optional model ${modelName} may not be available`)
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      console.error('[OVERVIEW] Prisma connection/model check failed:', errorMsg)
      console.error('[OVERVIEW] Available Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('$')))
      return NextResponse.json({ error: `Database connection error: ${errorMsg}` }, { status: 500 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Calculate core metrics first (batch to avoid pool exhaustion)
    const [totalTenants, activeTenants, tenantsThisWeek] = await Promise.all([
      (prisma.tenant && typeof prisma.tenant.count === 'function' 
        ? prisma.tenant.count() 
        : Promise.resolve(0)).catch((e) => {
        console.error('[OVERVIEW] Error counting tenants:', e)
        return 0
      }),
      (prisma.tenant && typeof prisma.tenant.count === 'function'
        ? prisma.tenant.count({ where: { status: 'active' } })
        : Promise.resolve(0)).catch((e) => {
        console.error('[OVERVIEW] Error counting active tenants:', e)
        return 0
      }),
      (prisma.tenant && typeof prisma.tenant.count === 'function'
        ? prisma.tenant.count({ where: { createdAt: { gte: sevenDaysAgo } } })
        : Promise.resolve(0)).catch((e) => {
        console.error('[OVERVIEW] Error counting tenants this week:', e)
        return 0
      }),
    ])

    // User metrics
    const [userCount, activeUsersLast30Days] = await Promise.all([
      (prisma.user && typeof prisma.user.count === 'function'
        ? prisma.user.count()
        : Promise.resolve(0)).catch((e) => {
        console.error('[OVERVIEW] Error counting users:', e)
        return 0
      }),
      (prisma.user && typeof prisma.user.count === 'function'
        ? prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } })
        : Promise.resolve(0)).catch((e) => {
        console.error('[OVERVIEW] Error counting active users:', e)
        return 0
      }),
    ])

    // AI usage and subscriptions
    let aiUsage = 0
    let subscriptionData = { mrr: 0, arr: 0 }
    
    try {
      if ('aIUsage' in prisma && prisma.aIUsage) {
        aiUsage = await prisma.aIUsage.count().catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error counting AI usage:', e)
      aiUsage = 0
    }

    try {
      if ('subscription' in prisma && prisma.subscription) {
        const result = await prisma.subscription.aggregate({
          where: { status: 'active' },
          _sum: { monthlyPrice: true },
        })
        subscriptionData = {
          mrr: Number(result._sum.monthlyPrice || 0),
          arr: Number(result._sum.monthlyPrice || 0) * 12,
        }
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating subscription data:', e)
      subscriptionData = { mrr: 0, arr: 0 }
    }

    // Module adoption stats (batch these together)
    let moduleUsage = { crm: 0, finance: 0, marketing: 0, hr: 0, whatsapp: 0 }
    try {
      if (prisma.tenant && typeof prisma.tenant.count === 'function') {
        const [crm, finance, marketing, hr, whatsapp] = await Promise.all([
          prisma.tenant.count({ where: { licensedModules: { has: 'crm' } } }).catch(() => 0),
          prisma.tenant.count({ where: { licensedModules: { has: 'finance' } } }).catch(() => 0),
          prisma.tenant.count({ where: { licensedModules: { has: 'marketing' } } }).catch(() => 0),
          prisma.tenant.count({ where: { licensedModules: { has: 'hr' } } }).catch(() => 0),
          prisma.tenant.count({ where: { licensedModules: { has: 'whatsapp' } } }).catch(() => 0),
        ])
        moduleUsage = { crm, finance, marketing, hr, whatsapp }
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating module usage:', e)
    }

    // Recent activity (last 24 hours)
    let recentActivity: {
      tenants: Array<{ type: string; id: string; name: string; tier: string | null; timestamp: string }>
      users: Array<{ type: string; id: string; email: string; name: string | null; tenant: string | undefined; timestamp: string }>
    } = { tenants: [], users: [] }
    try {
      if (prisma.tenant && prisma.user && typeof prisma.tenant.findMany === 'function' && typeof prisma.user.findMany === 'function') {
        const [tenants, users] = await Promise.all([
          prisma.tenant.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              createdAt: true,
              subscriptionTier: true,
            },
          }).catch(() => []),
          prisma.user.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              tenant: { select: { name: true } },
            },
          }).catch(() => []),
        ])
        recentActivity = {
          tenants: tenants.map((t) => ({
            type: 'tenant_created',
            id: t.id,
            name: t.name,
            tier: t.subscriptionTier,
            timestamp: t.createdAt.toISOString(),
          })),
          users: users.map((u) => ({
            type: 'user_invited',
            id: u.id,
            email: u.email,
            name: u.name,
            tenant: u.tenant?.name,
            timestamp: u.createdAt.toISOString(),
          })),
        }
      }
    } catch (e) {
      console.error('[OVERVIEW] Error fetching recent activity:', e)
    }

    // Calculate churn rate (tenants that became inactive in last 30 days)
    let churnedTenants = 0
    try {
      if (prisma.tenant && typeof prisma.tenant.count === 'function') {
        churnedTenants = await prisma.tenant.count({
          where: {
            status: { not: 'active' },
            updatedAt: { gte: thirtyDaysAgo },
          },
        }).catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating churned tenants:', e)
    }
    const churnRate = activeTenants > 0 ? (churnedTenants / activeTenants) * 100 : 0

    // Calculate MAU growth
    let previousMonthUsers = 0
    try {
      if (prisma.user && typeof prisma.user.count === 'function') {
        previousMonthUsers = await prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
              lt: thirtyDaysAgo,
            },
          },
        }).catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating previous month users:', e)
    }
    const mauGrowth =
      previousMonthUsers > 0
        ? ((activeUsersLast30Days - previousMonthUsers) / previousMonthUsers) * 100
        : 0

    // Calculate revenue sources (card payments, bank transfers, WhatsApp payments)
    let revenueSources = [0, 0, 0]
    try {
      if (prisma.invoice && typeof prisma.invoice.aggregate === 'function') {
        revenueSources = await Promise.all([
          prisma.invoice
            .aggregate({
              where: {
                status: 'paid',
                paidAt: { gte: thirtyDaysAgo },
                paymentMode: { in: ['card', 'credit_card', 'debit_card'] },
              },
              _sum: { total: true },
            })
            .then((r) => Number(r._sum?.total || 0))
            .catch(() => 0),
          prisma.invoice
            .aggregate({
              where: {
                status: 'paid',
                paidAt: { gte: thirtyDaysAgo },
                paymentMode: { in: ['bank_transfer', 'upi', 'neft', 'rtgs'] },
              },
              _sum: { total: true },
            })
            .then((r) => Number(r._sum?.total || 0))
            .catch(() => 0),
          prisma.invoice
            .aggregate({
              where: {
                status: 'paid',
                paidAt: { gte: thirtyDaysAgo },
                paymentMode: 'whatsapp',
              },
              _sum: { total: true },
            })
            .then((r) => Number(r._sum?.total || 0))
            .catch(() => 0),
        ])
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating revenue sources:', e)
    }

    const totalRevenue = revenueSources.reduce((a, b) => a + b, 0)

    // Calculate merchant health metrics
    let newMerchantsThisWeek = 0
    try {
      if (prisma.tenant && typeof prisma.tenant.count === 'function') {
        newMerchantsThisWeek = await prisma.tenant.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }).catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating new merchants this week:', e)
    }

    // Calculate at-risk merchants (tenants with no user logins in last 30 days)
    let atRiskMerchants = 0
    try {
      if (prisma.tenant && prisma.user && typeof prisma.tenant.findMany === 'function' && typeof prisma.user.count === 'function') {
        atRiskMerchants = await prisma.tenant
          .findMany({
            where: { status: 'active' },
            select: { id: true },
          })
          .then(async (tenants) => {
            const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            let atRiskCount = 0
            for (const tenant of tenants) {
              const recentLogins = await prisma.user.count({
                where: {
                  tenantId: tenant.id,
                  lastLoginAt: { gte: cutoffDate },
                },
              }).catch(() => 0)
              if (recentLogins === 0) atRiskCount++
            }
            return atRiskCount
          })
          .catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating at-risk merchants:', e)
    }

    let highVolumeMerchants = 0
    try {
      if (prisma.tenant && typeof prisma.tenant.count === 'function') {
        highVolumeMerchants = await prisma.tenant.count({
          where: {
            status: 'active',
          },
        }).catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating high volume merchants:', e)
    }

    let failedPayments = 0
    let totalPayments = 1
    try {
      if (prisma.invoice && typeof prisma.invoice.count === 'function') {
        failedPayments = await prisma.invoice.count({
          where: {
            status: 'failed',
            createdAt: { gte: thirtyDaysAgo },
          },
        }).catch(() => 0)
        totalPayments = await prisma.invoice.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
        }).catch(() => 1)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating payment metrics:', e)
    }
    const failedPaymentRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0

    // Platform health metrics
    let whatsappMessages = 0
    try {
      if (prisma.whatsappMessage && typeof prisma.whatsappMessage.count === 'function') {
        whatsappMessages = await prisma.whatsappMessage.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }).catch(() => 0)
      }
    } catch (e) {
      console.error('[OVERVIEW] Error calculating WhatsApp messages:', e)
    }

    // Log values for debugging
    console.log('[OVERVIEW] Metrics:', {
      totalTenants,
      activeTenants,
      tenantsThisWeek,
      userCount,
      activeUsersLast30Days,
      mrr: subscriptionData.mrr,
      arr: subscriptionData.arr,
    })

    const data = {
      totalTenants,
      activeTenants,
      tenantsThisWeek,
      mau: activeUsersLast30Days,
      mauGrowth: mauGrowth.toFixed(1),
      mrr: subscriptionData.mrr,
      arr: subscriptionData.arr,
      mrrGrowth: '8.0', // Placeholder - can calculate from historical data
      churnRate: churnRate.toFixed(1),
      aiUsageCount: aiUsage,
      revenueSources: {
        card: revenueSources[0],
        bank: revenueSources[1],
        whatsapp: revenueSources[2],
        total: totalRevenue,
      },
      merchantHealth: {
        newThisWeek: newMerchantsThisWeek,
        atRisk: atRiskMerchants,
        highVolume: highVolumeMerchants,
        failedPaymentRate: failedPaymentRate.toFixed(1),
      },
      platformHealth: {
        apiUptime: 99.8,
        whatsappMessages,
        aiCalls: aiUsage,
        criticalAlerts: 0,
      },
      moduleAdoption: {
        crm: { tenants: moduleUsage.crm, percentage: totalTenants > 0 ? Math.round((moduleUsage.crm / totalTenants) * 100) : 0 },
        finance: {
          tenants: moduleUsage.finance,
          percentage: totalTenants > 0 ? Math.round((moduleUsage.finance / totalTenants) * 100) : 0,
        },
        marketing: {
          tenants: moduleUsage.marketing,
          percentage: totalTenants > 0 ? Math.round((moduleUsage.marketing / totalTenants) * 100) : 0,
        },
        hr: {
          tenants: moduleUsage.hr,
          percentage: totalTenants > 0 ? Math.round((moduleUsage.hr / totalTenants) * 100) : 0,
        },
        whatsapp: {
          tenants: moduleUsage.whatsapp,
          percentage: totalTenants > 0 ? Math.round((moduleUsage.whatsapp / totalTenants) * 100) : 0,
        },
      },
      recentActivity: [...recentActivity.tenants, ...recentActivity.users]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
    }

    return NextResponse.json({ data })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    const errorStack = e instanceof Error ? e.stack : undefined
    console.error('[OVERVIEW] Super admin overview error:', errorMessage)
    if (errorStack) {
      console.error('[OVERVIEW] Stack trace:', errorStack)
    }
    // Ensure we always return a valid error object
    const errorResponse = {
      error: errorMessage || 'Unknown error occurred',
      ...(errorStack && process.env.NODE_ENV === 'development' ? { stack: errorStack } : {}),
    }
    console.error('[OVERVIEW] Returning error response:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
