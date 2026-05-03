import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth/password'
import { consumePasswordResetToken } from '@/lib/auth/password-reset'

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)
    const { userId } = await consumePasswordResetToken(token)

    const { prisma } = await import('@/lib/db/prisma')
    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('invalid or expired')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[reset-password] error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}

