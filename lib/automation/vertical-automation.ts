/**
 * Vertical-Specific Automation Sequences
 * Industry-specific automation workflows for Fintech, D2C, and Agencies
 */

import { prisma } from '@/lib/db/prisma'
import { triggerWorkflowByEvent } from './workflow-engine'

/**
 * Fintech-specific automation sequences
 */
export async function createFintechAutomations(tenantId: string): Promise<void> {
  // Compliance risk identified → Alert CEO
  await prisma.workflow.create({
    data: {
      tenantId,
      name: 'Fintech: Compliance Risk Alert',
      description: 'Alert CEO when compliance risk is identified',
      triggerType: 'EVENT',
      triggerEvent: 'deal.updated',
      steps: [
        {
          id: 'check-compliance',
          condition: {
            field: 'changes.complianceStatus',
            operator: 'equals',
            value: 'At Risk',
          },
          actions: [
            {
              type: 'notify',
              config: {
                type: 'warning',
                title: 'Compliance Risk Identified',
                message: 'A deal has been flagged with compliance risk',
                userId: 'ceo', // Would need to get actual CEO user ID
              },
            },
          ],
        },
      ] as any,
      isActive: true,
    },
  })

  // API integration stuck >5 days → Escalate to tech team
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Fintech: API Integration Stuck',
        description: 'Escalate to tech team if API evaluation stage >5 days',
        triggerType: 'SCHEDULE',
        triggerSchedule: '0 9 * * *', // Daily at 9 AM
        steps: [
          {
            id: 'check-api-stage',
            condition: {
              field: 'deal.stage',
              operator: 'equals',
              value: 'api-evaluation',
            },
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up on API Integration',
                  description: 'Deal has been in API evaluation for >5 days',
                  priority: 'high',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('Fintech API workflow may already exist')
  }

  // No go-live date set → Send urgency email
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Fintech: Missing Go-Live Date',
        description: 'Send reminder if go-live date not set in pricing stage',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-go-live',
            condition: {
              field: 'changes.stage',
              operator: 'equals',
              value: 'pricing-discussion',
            },
            actions: [
              {
                type: 'send_email',
                config: {
                  subject: 'Set Your Go-Live Timeline',
                  body: 'Please set your target go-live date to help us plan better.',
                  templateId: 'fintech-go-live-reminder',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('Fintech go-live workflow may already exist')
  }
}

/**
 * D2C-specific automation sequences
 */
export async function createD2CAutomations(tenantId: string): Promise<void> {
  // Inventory >10k units → Need advanced forecasting
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'D2C: High Inventory Alert',
        description: 'Offer advanced forecasting for high inventory',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-inventory',
            condition: {
              field: 'deal.customFields.Inventory Size',
              operator: 'greater_than',
              value: 10000,
            },
            actions: [
              {
                type: 'send_email',
                config: {
                  subject: 'Advanced Forecasting Available',
                  body: 'With your inventory size, you may benefit from our advanced forecasting features.',
                  templateId: 'd2c-forecasting-offer',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('D2C inventory workflow may already exist')
  }

  // Multiple suppliers → Offer supplier sync feature
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'D2C: Multiple Suppliers Offer',
        description: 'Offer supplier sync for multiple suppliers',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-suppliers',
            condition: {
              field: 'deal.customFields.Supplier Count',
              operator: 'greater_than',
              value: 3,
            },
            actions: [
              {
                type: 'send_email',
                config: {
                  subject: 'Supplier Sync Feature',
                  body: 'With multiple suppliers, our supplier sync feature can streamline your operations.',
                  templateId: 'd2c-supplier-sync',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('D2C supplier workflow may already exist')
  }

  // Sales channels >3 → Need unified dashboard demo
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'D2C: Multi-Channel Dashboard',
        description: 'Offer unified dashboard demo for multiple channels',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-channels',
            condition: {
              field: 'deal.customFields.Sales Channels',
              operator: 'in',
              value: ['Shopify', 'Instagram', 'Website', 'Amazon'],
            },
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Schedule Unified Dashboard Demo',
                  description: 'Customer has multiple sales channels - offer unified dashboard',
                  priority: 'medium',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('D2C channels workflow may already exist')
  }
}

/**
 * Agency-specific automation sequences
 */
export async function createAgencyAutomations(tenantId: string): Promise<void> {
  // Team size >5 → Offer team collaboration features
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Agency: Team Collaboration Offer',
        description: 'Offer collaboration features for larger teams',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-team-size',
            condition: {
              field: 'deal.customFields.Team Size',
              operator: 'greater_than',
              value: 5,
            },
            actions: [
              {
                type: 'send_email',
                config: {
                  subject: 'Team Collaboration Features',
                  body: 'With your team size, our collaboration features can improve productivity.',
                  templateId: 'agency-collaboration',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('Agency collaboration workflow may already exist')
  }

  // Hourly billing → Offer time tracking demo
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Agency: Time Tracking Demo',
        description: 'Offer time tracking demo for hourly billing',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-billing',
            condition: {
              field: 'deal.customFields.Billing Model',
              operator: 'equals',
              value: 'Hourly',
            },
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Schedule Time Tracking Demo',
                  description: 'Customer uses hourly billing - offer time tracking features',
                  priority: 'high',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('Agency time tracking workflow may already exist')
  }

  // Multiple projects → Offer project dashboard demo
  try {
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Agency: Project Dashboard Demo',
        description: 'Offer project dashboard for multiple projects',
        triggerType: 'EVENT',
        triggerEvent: 'deal.updated',
        steps: [
          {
            id: 'check-projects',
            condition: {
              field: 'deal.customFields.Project Types',
              operator: 'in',
              value: ['Web Development', 'Mobile App', 'Design'],
            },
            actions: [
              {
                type: 'send_email',
                config: {
                  subject: 'Project Dashboard Demo',
                  body: 'Our project dashboard can help you manage multiple projects efficiently.',
                  templateId: 'agency-project-dashboard',
                },
              },
            ],
          },
        ] as any,
        isActive: true,
      },
    })
  } catch (error) {
    console.log('Agency project dashboard workflow may already exist')
  }
}

/**
 * Create all vertical-specific automations for a tenant
 */
export async function createVerticalAutomations(
  tenantId: string,
  industry: 'fintech' | 'd2c' | 'agencies'
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = []
  let created = 0

  try {
    switch (industry) {
      case 'fintech':
        await createFintechAutomations(tenantId)
        created += 3
        break
      case 'd2c':
        await createD2CAutomations(tenantId)
        created += 3
        break
      case 'agencies':
        await createAgencyAutomations(tenantId)
        created += 3
        break
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return { created, errors }
}
