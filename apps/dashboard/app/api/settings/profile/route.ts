import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { hashPassword } from '@/lib/auth/password'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().or(z.literal('')).optional(),
  password: z.string().min(8).max(200).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get profile settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.userId || !user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateProfileSchema.parse(body)

    if (validated.email) {
      const existing = await prisma.user.findFirst({
        where: {
          tenantId: user.tenantId,
          email: validated.email.toLowerCase().trim(),
          NOT: { id: user.userId },
        },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({ error: 'Email is already used by another user in this workspace' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name.trim()
    if (validated.email !== undefined) updateData.email = validated.email.toLowerCase().trim()
    if (validated.avatar !== undefined) updateData.avatar = validated.avatar.trim() || null
    if (validated.password !== undefined) updateData.password = await hashPassword(validated.password)

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Update profile settings error:', error)
    return NextResponse.json({ error: 'Failed to update profile settings' }, { status: 500 })
  }
}

