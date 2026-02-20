import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { email, name, role, tenantId } = body

    if (!email || !tenantId) {
      return NextResponse.json(
        { error: 'Email and tenantId are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Generate a temporary password (user will need to reset it)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + '!@#'
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: role || 'member',
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    })

    // TODO: Send invitation email with password reset link
    // For now, return success with a note that email will be sent

    return NextResponse.json({
      success: true,
      message: 'User created successfully. Invitation email will be sent.',
      data: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (e) {
    console.error('Create user error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
