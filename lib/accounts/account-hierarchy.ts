/**
 * Account Hierarchy Service
 * Manages parent-child account relationships
 */

import { prisma } from '@/lib/db/prisma'

export class AccountHierarchyService {
  /**
   * Create account
   */
  static async createAccount(
    tenantId: string,
    data: {
      name: string
      parentAccountId?: string
      type?: string
      industry?: string
      annualRevenue?: number
      employeeCount?: number
      website?: string
      phone?: string
      email?: string
      address?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
    }
  ) {
    return prisma.account.create({
      data: {
        tenantId,
        name: data.name,
        parentAccountId: data.parentAccountId,
        type: data.type,
        industry: data.industry,
        annualRevenue: data.annualRevenue,
        employeeCount: data.employeeCount,
        website: data.website,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || 'India',
      },
      include: {
        parentAccount: true,
        childAccounts: true,
        contacts: true,
      },
    })
  }

  /**
   * Get account with hierarchy
   */
  static async getAccountWithHierarchy(tenantId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
      include: {
        parentAccount: {
          include: {
            parentAccount: true, // Up to 2 levels
          },
        },
        childAccounts: {
          include: {
            childAccounts: true, // Down to 2 levels
          },
        },
        contacts: {
          include: {
            deals: true,
          },
        },
        contracts: true,
      },
    })

    return account
  }

  /**
   * Get full account tree (all descendants)
   */
  static async getAccountTree(tenantId: string, accountId: string) {
    const account = await this.getAccountWithHierarchy(tenantId, accountId)
    if (!account) return null

    // Recursively get all descendants
    const getAllDescendants = async (acc: any): Promise<any> => {
      const children = await Promise.all(
        acc.childAccounts.map((child: any) => getAllDescendants(child))
      )

      return {
        ...acc,
        childAccounts: children,
      }
    }

    return getAllDescendants(account)
  }

  /**
   * Move account to different parent
   */
  static async moveAccount(
    tenantId: string,
    accountId: string,
    newParentId: string | null
  ) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
    })

    if (!account) {
      throw new Error('Account not found')
    }

    // Prevent circular reference
    if (newParentId) {
      const newParent = await prisma.account.findFirst({
        where: { id: newParentId, tenantId },
      })

      if (!newParent) {
        throw new Error('Parent account not found')
      }

      // Check if new parent is a descendant (would create cycle)
      const isDescendant = await this.isDescendant(tenantId, newParentId, accountId)
      if (isDescendant) {
        throw new Error('Cannot move account: would create circular reference')
      }
    }

    return prisma.account.update({
      where: { id: accountId },
      data: { parentAccountId: newParentId },
      include: {
        parentAccount: true,
        childAccounts: true,
      },
    })
  }

  /**
   * Check if account is descendant of another
   */
  private static async isDescendant(
    tenantId: string,
    ancestorId: string,
    descendantId: string
  ): Promise<boolean> {
    const descendant = await prisma.account.findFirst({
      where: { id: descendantId, tenantId },
      include: { childAccounts: true },
    })

    if (!descendant) return false

    // Check direct children
    if (descendant.childAccounts.some((child: any) => child.id === ancestorId)) {
      return true
    }

    // Recursively check descendants
    for (const child of descendant.childAccounts) {
      if (await this.isDescendant(tenantId, ancestorId, child.id)) {
        return true
      }
    }

    return false
  }

  /**
   * List accounts with hierarchy
   */
  static async listAccounts(
    tenantId: string,
    filters?: {
      type?: string
      industry?: string
      parentAccountId?: string | null // null = root accounts only
    }
  ) {
    return prisma.account.findMany({
      where: {
        tenantId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.industry && { industry: filters.industry }),
        ...(filters?.parentAccountId !== undefined && {
          parentAccountId: filters.parentAccountId,
        }),
      },
      include: {
        parentAccount: true,
        childAccounts: true,
        _count: {
          select: {
            contacts: true,
            contracts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Get root accounts (no parent)
   */
  static async getRootAccounts(tenantId: string) {
    return prisma.account.findMany({
      where: {
        tenantId,
        parentAccountId: null,
      },
      include: {
        childAccounts: {
          include: {
            childAccounts: true,
          },
        },
        _count: {
          select: {
            contacts: true,
            contracts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }
}
