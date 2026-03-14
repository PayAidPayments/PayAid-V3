/**
 * Accounts API Route
 * POST /api/accounts - Create account
 * GET /api/accounts - List accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AccountHierarchyService } from '@/lib/accounts/account-hierarchy'
import { z } from 'zod'

const createAccountSchema = z.object({
  name: z.string().min(1),
  parentAccountId: z.string().optional(),
  type: z.string().optional(),
  industry: z.string().optional(),
  annualRevenue: z.number().optional(),
  employeeCount: z.number().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
})

// POST /api/accounts - Create account
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createAccountSchema.parse(body)

    const account = await AccountHierarchyService.createAccount(tenantId, validated)

    return NextResponse.json({
      success: true,
      data: account,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    )
  }
}

// GET /api/accounts - List accounts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || undefined
    const industry = searchParams.get('industry') || undefined
    const parentAccountId = searchParams.get('parentAccountId')

    const accounts = await AccountHierarchyService.listAccounts(tenantId, {
      type,
      industry,
      parentAccountId: parentAccountId === 'null' ? null : parentAccountId || undefined,
    })

    return NextResponse.json({
      success: true,
      data: accounts,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to list accounts' },
      { status: 500 }
    )
  }
}
