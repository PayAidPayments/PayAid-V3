/**
 * Compliance Guard
 * Ensures data access and AI operations comply with regulations
 */

import { maskPIIInText, containsPII } from './pii-detector'
import { logAudit, logPIIAccess } from './audit-logger'

export interface ComplianceConfig {
  maskPII: boolean
  allowedDataTypes: string[]
  requireApprovalFor: string[]
  auditLog: boolean
  dataRetention: number // days
}

// Default compliance policies per company tier
const COMPANY_COMPLIANCE_POLICIES: Record<string, ComplianceConfig> = {
  default: {
    maskPII: true,
    allowedDataTypes: [
      'invoices',
      'orders',
      'customers',
      'products',
      'employees',
      'analytics',
    ],
    requireApprovalFor: [
      'customer_email',
      'customer_phone',
      'employee_salary',
      'payment_details',
    ],
    auditLog: true,
    dataRetention: 90,
  },
  healthcare: {
    maskPII: true,
    allowedDataTypes: ['invoices', 'orders', 'analytics'],
    requireApprovalFor: ['customer_name', 'customer_email', 'customer_phone'],
    auditLog: true,
    dataRetention: 365, // HIPAA requires longer retention
  },
  fintech: {
    maskPII: true,
    allowedDataTypes: ['invoices', 'customers', 'analytics'],
    requireApprovalFor: [
      'payment_details',
      'bank_accounts',
      'transaction_amounts',
      'customer_name',
    ],
    auditLog: true,
    dataRetention: 2555, // 7 years for audit
  },
}

export class ComplianceGuard {
  /**
   * Sanitize context data for AI processing
   */
  async sanitizeContext(
    context: any,
    tenantId: string,
    userId: string,
    companyTier: string = 'default'
  ): Promise<any> {
    const policy = COMPANY_COMPLIANCE_POLICIES[companyTier] || COMPANY_COMPLIANCE_POLICIES.default

    // Convert context to string for PII detection
    const contextString = JSON.stringify(context)

    // Check if PII is present
    if (containsPII(contextString)) {
      // Log PII access
      if (policy.auditLog) {
        await logPIIAccess(tenantId, userId, 'context_data', 'AI context contains PII')
      }

      // Mask PII if policy requires
      if (policy.maskPII) {
        const maskedString = maskPIIInText(contextString)
        try {
          return JSON.parse(maskedString)
        } catch {
          // If parsing fails, return original (shouldn't happen)
          return context
        }
      }
    }

    return context
  }

  /**
   * Check if user can access specific data type
   */
  async checkDataAccess(
    dataType: string,
    tenantId: string,
    userId: string,
    companyTier: string = 'default'
  ): Promise<boolean> {
    const policy = COMPANY_COMPLIANCE_POLICIES[companyTier] || COMPANY_COMPLIANCE_POLICIES.default

    // Check if data type is allowed
    if (!policy.allowedDataTypes.includes(dataType)) {
      return false
    }

    // Check if approval is required
    if (policy.requireApprovalFor.includes(dataType)) {
      // In Phase 2, this will check approval queue
      // For now, log and allow (with audit trail)
      if (policy.auditLog) {
        await logAudit({
          action: 'data_access_approval_required',
          dataType,
          tenantId,
          userId,
          context: `Access to ${dataType} requires approval`,
        })
      }
      // Phase 2: Return false and queue for approval
      // For now, allow with audit log
    }

    return true
  }

  /**
   * Get compliance policy for company
   */
  getCompliancePolicy(companyTier: string = 'default'): ComplianceConfig {
    return COMPANY_COMPLIANCE_POLICIES[companyTier] || COMPANY_COMPLIANCE_POLICIES.default
  }
}

// Singleton instance
export const complianceGuard = new ComplianceGuard()
