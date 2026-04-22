import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPasswordResetTokenForUser, markAdminOneTimeKeyAsUsed } from '@/lib/auth/password-reset'

const tenantScopeKey = 'kennt-cement'

const requestSchema = z.object({
  email: z.string().email(),
})

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function buildResetLink(request: NextRequest, token: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const baseUrl = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : request.nextUrl.origin
  return `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.ADMIN_UTILITY_SECRET?.trim()
    const providedSecret = request.headers.get('x-admin-utility-secret')?.trim()
    if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized utility access' }, { status: 401 })
    }

    const oneTimeKey = process.env.KENNT_CEMENT_ONE_TIME_RESET_KEY?.trim()
    const providedOneTimeKey = request.headers.get('x-reset-once-key')?.trim()
    if (!oneTimeKey || !providedOneTimeKey || providedOneTimeKey !== oneTimeKey) {
      return NextResponse.json({ error: 'Invalid one-time reset key' }, { status: 401 })
    }

    const consumed = await markAdminOneTimeKeyAsUsed(tenantScopeKey, providedOneTimeKey)
    if (!consumed) {
      return NextResponse.json({ error: 'One-time key already used' }, { status: 409 })
    }

    const body = await request.json()
    const { email } = requestSchema.parse(body)
    const normalizedEmail = normalize(email)

    const { prisma } = await import('@/lib/db/prisma')
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        tenant: {
          select: {
            name: true,
            subdomain: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tenantName = normalize(user.tenant?.name || '')
    const tenantSubdomain = normalize(user.tenant?.subdomain || '')
    const inKenntTenant =
      tenantName === 'kennt cement' || tenantSubdomain === 'kennt-cement' || tenantSubdomain === 'kennt'

    if (!inKenntTenant) {
      return NextResponse.json({ error: 'User is not in Kennt Cement tenant scope' }, { status: 400 })
    }

    const rawToken = await createPasswordResetTokenForUser(user.id)
    const resetLink = buildResetLink(request, rawToken)

    return NextResponse.json({
      success: true,
      message: 'One-time reset link generated for Kennt Cement user.',
      email: user.email,
      resetLink,
      expiresInMinutes: 30,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[admin one-time reset] error:', error)
    return NextResponse.json({ error: 'Failed to generate one-time reset link' }, { status: 500 })
  }
}

