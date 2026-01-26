/**
 * India-Specific Compliance Features
 * GST tracking, labor law compliance, and Indian regulatory requirements
 */

import { prisma } from '@/lib/db/prisma'
import { logAudit } from './audit-logger'

export interface GSTComplianceData {
  tenantId: string
  gstin: string
  filingStatus: 'filed' | 'pending' | 'overdue'
  lastFilingDate?: Date
  nextFilingDate?: Date
  taxLiability: number
  inputTaxCredit: number
  outputTax: number
}

export interface LaborLawCompliance {
  tenantId: string
  pfCompliance: {
    status: 'compliant' | 'pending' | 'non-compliant'
    lastContributionDate?: Date
    nextContributionDate?: Date
    employeeCount: number
  }
  esiCompliance: {
    status: 'compliant' | 'pending' | 'non-compliant'
    lastContributionDate?: Date
    nextContributionDate?: Date
    employeeCount: number
  }
  laborContractCompliance: {
    status: 'compliant' | 'pending' | 'non-compliant'
    contractsSigned: number
    contractsPending: number
  }
}

/**
 * Get GST compliance status for a tenant
 */
export async function getGSTCompliance(tenantId: string): Promise<GSTComplianceData | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      gstin: true,
      invoices: {
        where: {
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 3)), // Last 3 months
          },
        },
        select: {
          total: true,
          tax: true,
          createdAt: true,
        },
      },
    },
  })

  if (!tenant || !tenant.gstin) {
    return null
  }

  // Calculate tax liability from invoices
  const invoices = tenant.invoices
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
  const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.tax || 0), 0)

  // Determine filing status (simplified - in production, integrate with GST portal API)
  const lastInvoiceDate = invoices.length > 0
    ? invoices[invoices.length - 1].createdAt
    : null

  // GST filing is typically monthly or quarterly
  const daysSinceLastInvoice = lastInvoiceDate
    ? Math.floor((Date.now() - lastInvoiceDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  let filingStatus: 'filed' | 'pending' | 'overdue' = 'filed'
  if (daysSinceLastInvoice > 45) {
    filingStatus = 'overdue'
  } else if (daysSinceLastInvoice > 30) {
    filingStatus = 'pending'
  }

  return {
    tenantId,
    gstin: tenant.gstin,
    filingStatus,
    lastFilingDate: lastInvoiceDate || undefined,
    nextFilingDate: lastInvoiceDate
      ? new Date(lastInvoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from last
      : undefined,
    taxLiability: totalTax,
    inputTaxCredit: 0, // Would need to track from purchase invoices
    outputTax: totalTax,
  }
}

/**
 * Get labor law compliance status
 */
export async function getLaborLawCompliance(tenantId: string): Promise<LaborLawCompliance> {
  // Get employee count
  const employeeCount = await prisma.employee.count({
    where: {
      tenantId,
      // status: 'active' // If you have status field
    },
  })

  // PF Compliance (Provident Fund)
  // PF is mandatory for companies with 20+ employees
  const pfRequired = employeeCount >= 20
  const pfContributions = await prisma.pfConfig.findFirst({
    where: { tenantId },
  })

  let pfStatus: 'compliant' | 'pending' | 'non-compliant' = 'compliant'
  if (pfRequired && !pfContributions) {
    pfStatus = 'non-compliant'
  } else if (pfRequired && pfContributions) {
    // Check last contribution date
    const lastContribution = await prisma.payrollRun.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    if (lastContribution) {
      const daysSince = Math.floor(
        (Date.now() - lastContribution.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSince > 35) {
        pfStatus = 'pending'
      }
    }
  }

  // ESI Compliance (Employee State Insurance)
  // ESI is mandatory for companies with 10+ employees (in some states)
  const esiRequired = employeeCount >= 10
  const esiConfig = await prisma.ptConfig.findFirst({
    where: { tenantId },
  })

  let esiStatus: 'compliant' | 'pending' | 'non-compliant' = 'compliant'
  if (esiRequired && !esiConfig) {
    esiStatus = 'non-compliant'
  }

  // Labor Contract Compliance
  const totalEmployees = await prisma.employee.count({ where: { tenantId } })
  // In a real system, you'd check if contracts are signed
  const contractsSigned = totalEmployees // Placeholder
  const contractsPending = 0 // Placeholder

  return {
    tenantId,
    pfCompliance: {
      status: pfStatus,
      employeeCount,
      lastContributionDate: pfContributions?.updatedAt || undefined,
      nextContributionDate: pfContributions
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined,
    },
    esiCompliance: {
      status: esiStatus,
      employeeCount,
      lastContributionDate: esiConfig?.updatedAt || undefined,
      nextContributionDate: esiConfig
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined,
    },
    laborContractCompliance: {
      status:
        contractsPending === 0 ? 'compliant' : contractsPending < totalEmployees / 2 ? 'pending' : 'non-compliant',
      contractsSigned,
      contractsPending,
    },
  }
}

/**
 * Track GST filing
 */
export async function recordGSTFiling(
  tenantId: string,
  filingData: {
    period: string // e.g., "2024-01"
    gstr1Filed: boolean
    gstr3bFiled: boolean
    taxPaid: number
    filedBy: string
    filingDate: Date
  }
): Promise<void> {
  await logAudit({
    action: 'GST_FILING_RECORDED',
    dataType: 'gst_compliance',
    tenantId,
    userId: filingData.filedBy,
    context: `GST filing recorded for period ${filingData.period}. Tax paid: ₹${filingData.taxPaid}`,
    metadata: filingData,
  })

  // In production, store this in a GSTFiling table
  console.log(`GST filing recorded for tenant ${tenantId}:`, filingData)
}

/**
 * Track labor law compliance updates
 */
export async function recordLaborComplianceUpdate(
  tenantId: string,
  update: {
    type: 'pf' | 'esi' | 'contract'
    status: 'compliant' | 'pending' | 'non-compliant'
    updatedBy: string
    notes?: string
  }
): Promise<void> {
  await logAudit({
    action: 'LABOR_COMPLIANCE_UPDATED',
    dataType: 'labor_compliance',
    tenantId,
    userId: update.updatedBy,
    context: `${update.type.toUpperCase()} compliance updated to ${update.status}`,
    metadata: update,
  })
}
