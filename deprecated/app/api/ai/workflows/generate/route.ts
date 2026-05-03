/**
 * Natural Language Workflow Generation API
 * Converts natural language descriptions into workflow definitions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { WORKFLOW_EVENTS, ACTION_TYPES } from '@/lib/workflow/types'

/** POST /api/ai/workflows/generate - Generate workflow from natural language */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { description } = body

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      )
    }

    // Parse natural language description
    const desc = description.toLowerCase()

    // Extract trigger
    let triggerType: 'EVENT' | 'SCHEDULE' | 'MANUAL' = 'EVENT'
    let triggerEvent: string | undefined
    let triggerSchedule: string | undefined

    if (desc.includes('when') || desc.includes('new') || desc.includes('created')) {
      triggerType = 'EVENT'
      if (desc.includes('contact') || desc.includes('lead') || desc.includes('customer')) {
        triggerEvent = 'contact.created'
      } else if (desc.includes('deal')) {
        triggerEvent = 'deal.created'
      } else if (desc.includes('invoice')) {
        triggerEvent = 'invoice.created'
      } else {
        triggerEvent = 'contact.created' // Default
      }
    } else if (desc.includes('schedule') || desc.includes('daily') || desc.includes('weekly')) {
      triggerType = 'SCHEDULE'
      if (desc.includes('daily')) {
        triggerSchedule = '0 9 * * *' // 9 AM daily
      } else if (desc.includes('weekly')) {
        triggerSchedule = '0 9 * * 1' // 9 AM Monday
      } else {
        triggerSchedule = '0 9 * * 1-5' // 9 AM weekdays
      }
    } else {
      triggerType = 'MANUAL'
    }

    // Extract actions
    const steps: Array<{ id: string; type: string; config: Record<string, unknown>; order: number }> = []
    let order = 0

    if (desc.includes('email') || desc.includes('send email') || desc.includes('notify')) {
      steps.push({
        id: `step_${Date.now()}_${order}`,
        type: 'send_email',
        order: order++,
        config: {
          to: '{{contact.email}}',
          subject: desc.includes('welcome') ? 'Welcome!' : 'Notification',
          body: 'Thank you for your interest.',
        },
      })
    }

    if (desc.includes('sms') || desc.includes('text')) {
      steps.push({
        id: `step_${Date.now()}_${order}`,
        type: 'send_sms',
        order: order++,
        config: {
          to: '{{contact.phone}}',
          body: 'Thank you for contacting us.',
        },
      })
    }

    if (desc.includes('task') || desc.includes('follow up') || desc.includes('remind')) {
      steps.push({
        id: `step_${Date.now()}_${order}`,
        type: 'create_task',
        order: order++,
        config: {
          title: 'Follow up',
          dueInDays: 3,
        },
      })
    }

    if (desc.includes('whatsapp')) {
      steps.push({
        id: `step_${Date.now()}_${order}`,
        type: 'send_whatsapp',
        order: order++,
        config: {
          to: '{{contact.phone}}',
          body: 'Hello! Thank you for your interest.',
        },
      })
    }

    // If no actions detected, add default email
    if (steps.length === 0) {
      steps.push({
        id: `step_${Date.now()}_0`,
        type: 'send_email',
        order: 0,
        config: {
          to: '{{contact.email}}',
          subject: 'Notification',
          body: 'This is an automated notification.',
        },
      })
    }

    // Generate workflow name
    const name = description.length > 50
      ? description.substring(0, 47) + '...'
      : description

    return NextResponse.json({
      workflow: {
        name,
        description,
        triggerType,
        triggerEvent,
        triggerSchedule,
        isActive: true,
        steps,
      },
      suggestions: [
        'Review and customize the generated workflow',
        'Test the workflow before activating',
        'Add more steps if needed',
      ],
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate workflow' },
      { status: 500 }
    )
  }
}
