import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'

/**
 * GET /api/admin/ensure-demo-user
 * Checks if demo user exists and creates it if missing
 * This is a diagnostic/utility endpoint
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ENSURE_DEMO_USER] Checking for demo user...')
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
      include: { tenant: true },
    })

    if (existingUser) {
      console.log('[ENSURE_DEMO_USER] Demo user exists:', {
        id: existingUser.id,
        email: existingUser.email,
        hasPassword: !!existingUser.password,
        tenantId: existingUser.tenantId,
        tenantName: existingUser.tenant?.name,
      })
      
      return NextResponse.json({
        success: true,
        message: 'Demo user exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          hasPassword: !!existingUser.password,
          tenantId: existingUser.tenantId,
          tenantName: existingUser.tenant?.name,
        },
      })
    }

    // User doesn't exist - create it
    console.log('[ENSURE_DEMO_USER] Demo user not found, creating...')
    
    // Find or create demo tenant
    let tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: 'demo' },
          { name: { contains: 'Demo', mode: 'insensitive' } },
        ],
      },
    })

    if (!tenant) {
      // Create demo tenant
      tenant = await prisma.tenant.create({
        data: {
          name: 'Demo Business Pvt Ltd',
          subdomain: 'demo',
          plan: 'professional',
          status: 'active',
          maxContacts: 1000,
          maxInvoices: 1000,
          maxUsers: 10,
          maxStorage: 10240,
        },
      })
      console.log('[ENSURE_DEMO_USER] Created demo tenant:', tenant.id)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Test@1234', 10)

    // Create demo user
    const newUser = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'owner',
        tenantId: tenant.id,
      },
    })

    console.log('[ENSURE_DEMO_USER] Created demo user:', newUser.id)

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tenantId: newUser.tenantId,
        tenantName: tenant.name,
      },
      credentials: {
        email: 'admin@demo.com',
        password: 'Test@1234',
      },
    })
  } catch (error) {
    console.error('[ENSURE_DEMO_USER] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ensure-demo-user
 * Forces password reset for demo user
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[ENSURE_DEMO_USER] Resetting demo user password...')
    
    // Hash new password
    const hashedPassword = await bcrypt.hash('Test@1234', 10)

    // Update or create user
    const user = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'owner',
        tenantId: (await prisma.tenant.findFirst({
          where: {
            OR: [
              { subdomain: 'demo' },
              { name: { contains: 'Demo', mode: 'insensitive' } },
            ],
          },
        }))?.id || (await prisma.tenant.create({
          data: {
            name: 'Demo Business Pvt Ltd',
            subdomain: 'demo',
            plan: 'professional',
            status: 'active',
          },
        })).id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Demo user password reset successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      credentials: {
        email: 'admin@demo.com',
        password: 'Test@1234',
      },
    })
  } catch (error) {
    console.error('[ENSURE_DEMO_USER] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
