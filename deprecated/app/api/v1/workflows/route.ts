/**
 * Public API v1: Workflows endpoint
 * Supports both JWT (internal) and API key (external) authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateApiRequest, requireScope } from '@/lib/middleware/api-key-auth'
import type { WorkflowStep } from '@/lib/workflow/types'

/** GET /api/v1/workflows - List workflows (public API) */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    if (authResult.authType === 'api_key') {
      const hasScope = requireScope(['read:workflows'])(authResult)
      if (!hasScope) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Required scope: read:workflows' },
          { status: 403 }
        )
      }
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId: authResult.tenantId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        triggerType: true,
        triggerEvent: true,
        triggerSchedule: true,
        steps: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      data: workflows.map((w) => ({
        ...w,
        stepsCount: Array.isArray(w.steps) ? (w.steps as unknown as WorkflowStep[]).length : 0,
      })),
    })
  } catch (error) {
    console.error('[API] v1/workflows GET', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

/** POST /api/v1/workflows - Create workflow (public API) */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    if (authResult.authType === 'api_key') {
      const hasScope = requireScope(['write:workflows'])(authResult)
      if (!hasScope) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Required scope: write:workflows' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { name, description, triggerType, triggerEvent, triggerSchedule, steps = [] } = body

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: 'name and triggerType are required' },
        { status: 400 }
      )
    }

    const workflow = await prisma.workflow.create({
      data: {
        tenantId: authResult.tenantId,
        name: String(name),
        description: description ? String(description) : null,
        triggerType: String(triggerType),
        triggerEvent: triggerEvent ? String(triggerEvent) : null,
        triggerSchedule: triggerSchedule ? String(triggerSchedule) : null,
        isActive: true,
        steps: Array.isArray(steps) ? steps : [],
      },
    })

    return NextResponse.json({ data: workflow }, { status: 201 })
  } catch (error) {
    console.error('[API] v1/workflows POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
