/**
 * Decision Tree Service
 * Maps decision makers and their influence in accounts
 */

import { prisma } from '@/lib/db/prisma'

export interface DecisionMaker {
  contactId: string
  name: string
  role: string
  influence: number // 0-100
  relationship: 'champion' | 'influencer' | 'decision_maker' | 'blocker' | 'end_user'
  notes?: string
}

export interface DecisionTree {
  accountId: string
  decisionMakers: DecisionMaker[]
  orgChart: any // Hierarchical structure
  buyingProcess: string[]
  lastUpdated: Date
}

export class DecisionTreeService {
  /**
   * Update decision tree for account
   */
  static async updateDecisionTree(
    tenantId: string,
    accountId: string,
    decisionMakers: DecisionMaker[]
  ) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
    })

    if (!account) {
      throw new Error('Account not found')
    }

    // Verify all contacts belong to this account
    const contactIds = decisionMakers.map((dm) => dm.contactId)
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        accountId,
        tenantId,
      },
    })

    if (contacts.length !== contactIds.length) {
      throw new Error('Some contacts do not belong to this account')
    }

    // Build decision tree structure
    const decisionTree: DecisionTree = {
      accountId,
      decisionMakers,
      orgChart: this.buildOrgChart(decisionMakers),
      buyingProcess: this.inferBuyingProcess(decisionMakers),
      lastUpdated: new Date(),
    }

    return prisma.account.update({
      where: { id: accountId },
      data: {
        decisionTree: decisionTree as any,
      },
      include: {
        contacts: true,
      },
    })
  }

  /**
   * Get decision tree for account
   */
  static async getDecisionTree(tenantId: string, accountId: string): Promise<DecisionTree | null> {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
      include: {
        contacts: true,
      },
    })

    if (!account || !account.decisionTree) {
      return null
    }

    return account.decisionTree as unknown as DecisionTree
  }

  /**
   * Add decision maker to account
   */
  static async addDecisionMaker(
    tenantId: string,
    accountId: string,
    decisionMaker: DecisionMaker
  ) {
    const tree = await this.getDecisionTree(tenantId, accountId)
    const decisionMakers = tree?.decisionMakers || []

    // Check if already exists
    const existing = decisionMakers.find((dm) => dm.contactId === decisionMaker.contactId)
    if (existing) {
      // Update existing
      const updated = decisionMakers.map((dm) =>
        dm.contactId === decisionMaker.contactId ? decisionMaker : dm
      )
      return this.updateDecisionTree(tenantId, accountId, updated)
    } else {
      // Add new
      return this.updateDecisionTree(tenantId, accountId, [...decisionMakers, decisionMaker])
    }
  }

  /**
   * Remove decision maker from account
   */
  static async removeDecisionMaker(
    tenantId: string,
    accountId: string,
    contactId: string
  ) {
    const tree = await this.getDecisionTree(tenantId, accountId)
    if (!tree) {
      throw new Error('Decision tree not found')
    }

    const updated = tree.decisionMakers.filter((dm) => dm.contactId !== contactId)
    return this.updateDecisionTree(tenantId, accountId, updated)
  }

  /**
   * Build org chart structure
   */
  private static buildOrgChart(decisionMakers: DecisionMaker[]): any {
    // Group by role/relationship
    const byRelationship: Record<string, DecisionMaker[]> = {}
    for (const dm of decisionMakers) {
      if (!byRelationship[dm.relationship]) {
        byRelationship[dm.relationship] = []
      }
      byRelationship[dm.relationship].push(dm)
    }

    return {
      decisionMaker: byRelationship.decision_maker || [],
      champion: byRelationship.champion || [],
      influencer: byRelationship.influencer || [],
      blocker: byRelationship.blocker || [],
      endUser: byRelationship.end_user || [],
    }
  }

  /**
   * Infer buying process from decision makers
   */
  private static inferBuyingProcess(decisionMakers: DecisionMaker[]): string[] {
    const process: string[] = []

    // If we have a champion, they typically initiate
    if (decisionMakers.some((dm) => dm.relationship === 'champion')) {
      process.push('Champion identifies need')
    }

    // Decision makers evaluate
    if (decisionMakers.some((dm) => dm.relationship === 'decision_maker')) {
      process.push('Decision makers evaluate options')
    }

    // Influencers provide input
    if (decisionMakers.some((dm) => dm.relationship === 'influencer')) {
      process.push('Influencers provide recommendations')
    }

    // Final approval
    process.push('Final approval and purchase')

    return process
  }

  /**
   * Get key decision maker (highest influence)
   */
  static async getKeyDecisionMaker(tenantId: string, accountId: string): Promise<DecisionMaker | null> {
    const tree = await this.getDecisionTree(tenantId, accountId)
    if (!tree || tree.decisionMakers.length === 0) {
      return null
    }

    return tree.decisionMakers.reduce((max, dm) =>
      dm.influence > max.influence ? dm : max
    )
  }
}
