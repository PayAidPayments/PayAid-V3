import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  googleAiStudioApiKey: z.string().optional().nullable(),
})

// GET /api/settings/tenant - Get tenant settings
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        domain: true,
        plan: true,
        status: true,
        gstin: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        maxContacts: true,
        maxInvoices: true,
        maxUsers: true,
        maxStorage: true,
        subscriptionId: true,
        currentPeriodEnd: true,
        googleAiStudioApiKey: true, // Include API key in response (for settings page)
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Don't expose the full API key, just show if it's configured
    const response = {
      ...tenant,
      googleAiStudioApiKey: tenant.googleAiStudioApiKey ? '***configured***' : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get tenant settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get tenant settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings/tenant - Update tenant settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateTenantSchema.parse(body)

    // Encrypt API key if provided
    const updateData: any = { ...validated }
    if (validated.googleAiStudioApiKey !== undefined) {
      try {
        // Trim the API key to remove any whitespace
        const trimmedApiKey = validated.googleAiStudioApiKey?.trim()
        
        if (trimmedApiKey) {
          // Validate API key format (Google AI Studio keys start with "AIza")
          if (!trimmedApiKey.startsWith('AIza')) {
            return NextResponse.json(
              {
                error: 'Invalid API key format',
                message: 'Google AI Studio API keys should start with "AIza". Please check your key and try again.',
                hint: 'Get your API key from https://aistudio.google.com/app/apikey',
              },
              { status: 400 }
            )
          }
          
          // Encrypt the API key
          updateData.googleAiStudioApiKey = encrypt(trimmedApiKey)
        } else {
          updateData.googleAiStudioApiKey = null
        }
      } catch (encryptError) {
        console.error('Encryption error:', encryptError)
        const errorMessage = encryptError instanceof Error ? encryptError.message : String(encryptError)
        
        // Check if it's an ENCRYPTION_KEY format error
        if (errorMessage.includes('64-character hexadecimal')) {
          return NextResponse.json(
            {
              error: 'Encryption failed',
              message: 'Server encryption key is not properly configured. Please contact support.',
              details: errorMessage,
              hint: 'ENCRYPTION_KEY must be a 64-character hexadecimal string. This is a server configuration issue that needs to be fixed by the administrator.',
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          {
            error: 'Encryption failed',
            message: 'Failed to encrypt API key. Please check server configuration.',
            details: errorMessage,
            hint: 'ENCRYPTION_KEY must be set in server environment variables. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
          },
          { status: 500 }
        )
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        subdomain: true,
        domain: true,
        plan: true,
        status: true,
        gstin: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        maxContacts: true,
        maxInvoices: true,
        maxUsers: true,
        maxStorage: true,
        subscriptionId: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update tenant settings error:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Failed to update tenant settings',
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    )
  }
}
