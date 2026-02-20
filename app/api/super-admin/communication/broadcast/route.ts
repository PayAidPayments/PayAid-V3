import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { getSendGridClient } from '@/lib/email/sendgrid'
import { z } from 'zod'

const broadcastSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  sendEmail: z.boolean().default(false),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  targetSegments: z.object({
    plans: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  }).optional(),
  scheduledFor: z.string().datetime().optional(),
})

/**
 * POST /api/super-admin/communication/broadcast
 * Send announcement to all tenants or specific segments
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    let decoded
    try {
      decoded = await requireSuperAdmin()
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message === 'Unauthorized' ? 'Unauthorized' : 'Forbidden' },
        { status: authError.message === 'Unauthorized' ? 401 : 403 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate request body
    let validated
    try {
      validated = broadcastSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Build tenant filter based on segments
    const where: any = {
      status: { in: validated.targetSegments?.statuses || ['active', 'trial'] },
    }

    if (validated.targetSegments?.plans && validated.targetSegments.plans.length > 0) {
      where.subscriptionTier = { in: validated.targetSegments.plans }
    }

    if (validated.targetSegments?.industries && validated.targetSegments.industries.length > 0) {
      where.industry = { in: validated.targetSegments.industries }
    }

    if (validated.targetSegments?.regions && validated.targetSegments.regions.length > 0) {
      where.country = { in: validated.targetSegments.regions }
    }

    // Get all matching tenants with their SalesReps (for Alert creation)
    const tenants = await prisma.tenant.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        industry: true,
        users: {
          where: {
            role: { in: ['admin', 'owner', 'SUPER_ADMIN'] },
          },
          select: {
            id: true,
            email: true,
            name: true,
            salesRep: {
              select: {
                id: true,
              },
            },
          },
          take: 1, // Get primary admin/owner
        },
      },
    })

    const totalTenants = tenants.length
    let emailsSent = 0
    let notificationsCreated = 0
    const errors: string[] = []

    // If scheduled, create scheduled announcements
    if (validated.scheduledFor) {
      const scheduledDate = new Date(validated.scheduledFor)
      
      // Create scheduled announcement records (we'll use a simple approach with Alert model)
      // For a proper implementation, you'd want a PlatformAnnouncement model
      for (const tenant of tenants) {
        try {
          // Find a user to associate with (admin/owner or first user)
          const targetUser = tenant.users[0]
          if (!targetUser) {
            errors.push(`Tenant ${tenant.name}: No admin user found`)
            continue
          }

          // Get or create SalesRep for the user
          let salesRep = targetUser.salesRep
          if (!salesRep) {
            // Create SalesRep if it doesn't exist
            salesRep = await prisma.salesRep.upsert({
              where: { userId: targetUser.id },
              update: {},
              create: {
                userId: targetUser.id,
                tenantId: tenant.id,
                conversionRate: 0,
                isOnLeave: false,
              },
            })
          }

          // Create a scheduled alert/notification
          // Note: This is a simplified approach. For production, create a PlatformAnnouncement model
          await prisma.alert.create({
            data: {
              repId: salesRep.id,
              tenantId: tenant.id,
              type: 'PLATFORM_ANNOUNCEMENT',
              title: validated.title,
              message: validated.message,
              priority: validated.priority,
              channels: validated.sendEmail ? ['in-app', 'email'] : ['in-app'],
              isRead: false,
            },
          })
          notificationsCreated++
        } catch (error: any) {
          errors.push(`Tenant ${tenant.name}: ${error.message}`)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Scheduled announcement for ${totalTenants} tenants`,
        scheduledFor: validated.scheduledFor,
        totalTenants,
        notificationsCreated,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // Send immediately
    const sendGrid = getSendGridClient()

    for (const tenant of tenants) {
      try {
        // Find a user to associate with (admin/owner or first user)
        const targetUser = tenant.users[0]
        if (!targetUser) {
          // Still try to send email if no user found
          if (validated.sendEmail && tenant.email) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${validated.title}</h2>
                <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${validated.message}</div>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #999; font-size: 12px;">This is an official announcement from PayAid Platform.</p>
              </div>
            `
            await sendGrid.sendEmail({
              to: tenant.email,
              from: process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.com',
              subject: `[PayAid] ${validated.title}`,
              html: emailHtml,
              text: validated.message,
            })
            emailsSent++
          }
          continue
        }

        // Get or create SalesRep for the user
        let salesRep = targetUser.salesRep
        if (!salesRep) {
          salesRep = await prisma.salesRep.upsert({
            where: { userId: targetUser.id },
            update: {},
            create: {
              userId: targetUser.id,
              tenantId: tenant.id,
              conversionRate: 0,
              isOnLeave: false,
            },
          })
        }

        // Create in-app notification
        await prisma.alert.create({
          data: {
            repId: salesRep.id,
            tenantId: tenant.id,
            type: 'PLATFORM_ANNOUNCEMENT',
            title: validated.title,
            message: validated.message,
            priority: validated.priority,
            channels: ['in-app'],
            isRead: false,
          },
        })
        notificationsCreated++

        // Send email if requested
        if (validated.sendEmail) {
          const recipientEmail = tenant.email || tenant.users[0]?.email
          if (recipientEmail) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${validated.title}</h2>
                <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${validated.message}</div>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #999; font-size: 12px;">This is an official announcement from PayAid Platform.</p>
              </div>
            `

            await sendGrid.sendEmail({
              to: recipientEmail,
              from: process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.com',
              subject: `[PayAid] ${validated.title}`,
              html: emailHtml,
              text: validated.message,
            })
            emailsSent++
          }
        }
      } catch (error: any) {
        errors.push(`Tenant ${tenant.name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Announcement sent to ${totalTenants} tenants`,
      totalTenants,
      notificationsCreated,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Broadcast error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}
