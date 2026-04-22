import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPasswordResetTokenForUser } from '@/lib/auth/password-reset'
import { getSendGridClient } from '@/lib/email/sendgrid'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

function buildResetLink(request: NextRequest, token: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const baseUrl = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : request.nextUrl.origin
  return `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)
    const normalizedEmail = email.toLowerCase().trim()

    const { prisma } = await import('@/lib/db/prisma')
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    })

    // Always return success response to avoid account enumeration.
    if (!user || !user.password) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for this email, a reset link has been sent.',
      })
    }

    const rawToken = await createPasswordResetTokenForUser(user.id)
    const resetLink = buildResetLink(request, rawToken)

    const sendGrid = getSendGridClient()
    const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim()
    let debugResetLink: string | undefined
    if (sendGridApiKey) {
      await sendGrid.sendEmail({
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.com',
        subject: 'Reset your PayAid password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to reset your PayAid password.</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;background:#53328A;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
                Reset Password
              </a>
            </p>
            <p>This link expires in 30 minutes and can be used only once.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
        text: `Reset your PayAid password: ${resetLink}\n\nThis link expires in 30 minutes and can be used only once.`,
      })
    } else {
      console.warn('[forgot-password] SENDGRID_API_KEY not configured; reset link generated but email not sent.')
      console.warn(`[forgot-password] reset link for ${normalizedEmail}: ${resetLink}`)
      if (process.env.NODE_ENV !== 'production') {
        debugResetLink = resetLink
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a reset link has been sent.',
      ...(debugResetLink ? { debugResetLink } : {}),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[forgot-password] error:', error)
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 })
  }
}

