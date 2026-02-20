/**
 * Contract Manager Service
 * Manages contracts, renewals, and alerts
 */

import { prisma } from '@/lib/db/prisma'

export class ContractManagerService {
  /**
   * Create contract
   */
  static async createContract(
    tenantId: string,
    data: {
      dealId?: string
      contactId?: string
      accountId?: string
      contractNumber: string
      title?: string
      contractType?: string
      partyName?: string
      value: number
      startDate: Date
      endDate: Date
      autoRenew?: boolean
      fileUrl?: string
      notes?: string
    }
  ) {
    // Calculate renewal date (30 days before end date)
    const renewalDate = new Date(data.endDate)
    renewalDate.setDate(renewalDate.getDate() - 30)

    // Get party name from contact or account if not provided
    let partyName = data.partyName
    if (!partyName && data.contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: data.contactId },
        select: { name: true, company: true },
      })
      partyName = contact?.company || contact?.name || 'Unknown'
    } else if (!partyName && data.accountId) {
      const account = await prisma.account.findUnique({
        where: { id: data.accountId },
        select: { name: true },
      })
      partyName = account?.name || 'Unknown'
    }

    return prisma.contract.create({
      data: {
        tenantId,
        dealId: data.dealId,
        contactId: data.contactId,
        accountId: data.accountId,
        contractNumber: data.contractNumber,
        title: data.title || `Contract ${data.contractNumber}`,
        contractType: data.contractType || 'SERVICE',
        partyName: partyName || 'Unknown',
        value: data.value,
        startDate: data.startDate,
        endDate: data.endDate,
        autoRenew: data.autoRenew || false,
        renewalDate,
        documentUrl: data.fileUrl,
        notes: data.notes,
        status: 'draft',
      },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
    })
  }

  /**
   * Get contracts expiring soon
   */
  static async getExpiringContracts(
    tenantId: string,
    daysAhead: number = 90
  ) {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    return prisma.contract.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
      orderBy: { endDate: 'asc' },
    })
  }

  /**
   * Get contracts requiring renewal
   */
  static async getContractsRequiringRenewal(tenantId: string) {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    return prisma.contract.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        renewalDate: {
          lte: futureDate,
          gte: now,
        },
        autoRenew: false, // Only manual renewals need attention
      },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
      orderBy: { renewalDate: 'asc' },
    })
  }

  /**
   * Update contract status
   */
  static async updateContractStatus(
    tenantId: string,
    contractId: string,
    status: 'draft' | 'active' | 'expired' | 'renewal_pending' | 'cancelled',
    metadata?: {
      signedAt?: Date
      cancelledAt?: Date
      cancellationReason?: string
    }
  ) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    return prisma.contract.update({
      where: { id: contractId },
      data: {
        status,
        ...(status === 'active' && metadata?.signedAt && { signedAt: metadata.signedAt }),
        ...(status === 'cancelled' && {
          cancelledAt: metadata?.cancelledAt || new Date(),
          cancellationReason: metadata?.cancellationReason,
        }),
      },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
    })
  }

  /**
   * Renew contract
   */
  static async renewContract(
    tenantId: string,
    contractId: string,
    newEndDate: Date
  ) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Calculate new renewal date
    const renewalDate = new Date(newEndDate)
    renewalDate.setDate(renewalDate.getDate() - 30)

    return prisma.contract.update({
      where: { id: contractId },
      data: {
        endDate: newEndDate,
        renewalDate,
        status: 'active',
      },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
    })
  }

  /**
   * Get contract by ID
   */
  static async getContract(tenantId: string, contractId: string) {
    return prisma.contract.findFirst({
      where: { id: contractId, tenantId },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
    })
  }

  /**
   * List contracts
   */
  static async listContracts(
    tenantId: string,
    filters?: {
      dealId?: string
      contactId?: string
      accountId?: string
      status?: string
    }
  ) {
    return prisma.contract.findMany({
      where: {
        tenantId,
        ...(filters?.dealId && { dealId: filters.dealId }),
        ...(filters?.contactId && { contactId: filters.contactId }),
        ...(filters?.accountId && { accountId: filters.accountId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        deal: true,
        contact: true,
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Process contract renewals (cron job)
   */
  static async processContractRenewals() {
    const now = new Date()

    // Find contracts that need renewal alerts
    const contracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        renewalDate: {
          lte: now,
        },
        expiryReminderSent: false,
      },
    })

    for (const contract of contracts) {
      // Update status to renewal_pending
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: 'renewal_pending',
          expiryReminderSent: true,
        },
      })

      // TODO: Send renewal alert email
      // await sendRenewalAlert(contract)
    }

    return {
      processed: contracts.length,
      contracts: contracts.map((c) => c.id),
    }
  }
}
