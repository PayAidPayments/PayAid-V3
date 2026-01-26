import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { signToken, signRefreshToken } from '@/lib/auth/jwt'
import { isDevelopment } from '@/lib/utils/env'
import { warmTenantCache } from '@/lib/cache/warmer'
import { getUserRoles, getUserPermissions } from '@/lib/rbac/permissions'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Handle GET requests (for health checks or direct access)
export async function GET() {
  return NextResponse.json(
    { message: 'Login API endpoint. Use POST to login.' },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  // Ensure we always return JSON, even for unexpected errors
  try {
    return await handleLogin(request)
  } catch (unexpectedError) {
    // Catch any errors that occur outside the main try-catch
    console.error('[LOGIN] Unexpected error outside handler:', unexpectedError)
    const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : 'An unexpected error occurred'
    const errorStack = unexpectedError instanceof Error ? unexpectedError.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Login failed',
        message: errorMessage,
        ...(isDevelopment() && { stack: errorStack }),
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

async function handleLogin(request: NextRequest) {
  const startTime = Date.now()
  let step = 'initialization'
  
  try {
    // Step 1: Parse request body
    step = 'parse_body'
    console.log('[LOGIN] Step 1: Parsing request body...')
    let body
    try {
      body = await request.json()
      console.log('[LOGIN] Request body parsed successfully', { email: body?.email ? 'provided' : 'missing' })
    } catch (parseError) {
      console.error('[LOGIN] Failed to parse request body:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined,
      })
      throw new Error('Invalid request body')
    }

    // Step 2: Validate input
    step = 'validate_input'
    console.log('[LOGIN] Step 2: Validating input...')
    let validated
    try {
      validated = loginSchema.parse(body)
      console.log('[LOGIN] Input validated successfully', { email: validated.email })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('[LOGIN] Validation failed:', {
          errors: validationError.errors,
          input: { email: body?.email, hasPassword: !!body?.password },
        })
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      throw validationError
    }

    // Step 3: Find user in database
    step = 'find_user'
    console.log('[LOGIN] Step 3: Finding user in database...', { email: validated.email.toLowerCase().trim() })
    
    // Check database connection first
    if (!process.env.DATABASE_URL) {
      console.error('[LOGIN] DATABASE_URL is not configured')
      throw new Error('Database configuration error: DATABASE_URL is missing')
    }
    
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: validated.email.toLowerCase().trim() },
        include: { 
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              plan: true,
              licensedModules: true,
              subscriptionTier: true,
            }
          }
        },
      })
      console.log('[LOGIN] Database query completed', { 
        userFound: !!user,
        userId: user?.id,
        hasTenant: !!user?.tenant,
      })
    } catch (dbError: any) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      const errorCode = dbError?.code
      const errorMeta = dbError?.meta
      
      console.error('[LOGIN] Database query failed:', {
        step: 'find_user',
        error: errorMessage,
        code: errorCode,
        meta: errorMeta,
        stack: dbError instanceof Error ? dbError.stack : undefined,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
      
      // Provide more specific error messages for common database errors
      if (errorCode === 'P1001' || errorMessage.includes('Can\'t reach database server')) {
        throw new Error('Database connection failed. Please check your database configuration.')
      } else if (errorCode === 'P2025' || errorMessage.includes('does not exist')) {
        throw new Error('Database table not found. Please run database migrations.')
      } else if (errorCode === 'P1000' || errorMessage.includes('Authentication failed')) {
        throw new Error('Database authentication failed. Please check your database credentials.')
      }
      
      throw new Error(`Database error: ${errorMessage}`)
    }

    // Step 4: Check if user exists
    step = 'check_user_exists'
    if (!user) {
      console.error('[LOGIN] User not found', { email: validated.email })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 5: Check if user has password
    step = 'check_password_set'
    if (!user.password) {
      console.error('[LOGIN] User has no password set', { 
        email: validated.email, 
        userId: user.id 
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 6: Verify password
    step = 'verify_password'
    console.log('[LOGIN] Step 6: Verifying password...', { userId: user.id })
    let isValid
    try {
      isValid = await verifyPassword(validated.password, user.password)
      console.log('[LOGIN] Password verification completed', { isValid })
    } catch (passwordError) {
      console.error('[LOGIN] Password verification failed:', {
        error: passwordError instanceof Error ? passwordError.message : String(passwordError),
        stack: passwordError instanceof Error ? passwordError.stack : undefined,
      })
      throw new Error(`Password verification error: ${passwordError instanceof Error ? passwordError.message : 'Unknown error'}`)
    }
    
    if (!isValid) {
      console.error('[LOGIN] Invalid password', { email: validated.email, userId: user.id })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 7: Update last login
    step = 'update_last_login'
    console.log('[LOGIN] Step 7: Updating last login timestamp...', { userId: user.id })
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      console.log('[LOGIN] Last login updated successfully')
    } catch (updateError: any) {
      console.error('[LOGIN] Failed to update last login (non-critical):', {
        error: updateError instanceof Error ? updateError.message : String(updateError),
        code: updateError?.code,
        stack: updateError instanceof Error ? updateError.stack : undefined,
      })
      // Non-critical error, continue with login
    }

    // Step 8: Get user roles and permissions (Phase 1: RBAC)
    // CRITICAL: Skip RBAC entirely if tables don't exist to prevent hanging
    step = 'get_roles_permissions'
    console.log('[LOGIN] Step 8: Resolving roles and permissions...', { 
      userId: user.id,
      tenantId: user.tenantId || 'none',
    })
    
    // Default to legacy role - RBAC is optional
    let roles: string[] = user.role ? [user.role] : []
    let permissions: string[] = []
    
    // ONLY attempt RBAC if explicitly enabled via environment variable
    // This prevents hanging on Vercel where tables may not exist
    const RBAC_ENABLED = process.env.ENABLE_RBAC === 'true'
    
    if (!RBAC_ENABLED) {
      console.log('[LOGIN] RBAC disabled via ENABLE_RBAC env var, using legacy role')
    } else if (user.tenantId) {
      // Quick check with very aggressive timeout (200ms)
      const RBAC_CHECK_TIMEOUT = 200 // 200ms max
      
      try {
        const checkPromise = prisma.userRole.count({
          where: { tenantId: user.tenantId },
          take: 1,
        }).catch(() => 0) // Catch any error and return 0
        
        const timeoutPromise = new Promise<number>((resolve) => {
          setTimeout(() => resolve(0), RBAC_CHECK_TIMEOUT)
        })
        
        const hasRBACData = await Promise.race([checkPromise, timeoutPromise])
        
        if (hasRBACData > 0) {
          // Only fetch if data exists - with very short timeout (500ms)
          const RBAC_FETCH_TIMEOUT = 500
          try {
            const rbacPromise = Promise.all([
              getUserRoles(user.id, user.tenantId).catch(() => []),
              getUserPermissions(user.id, user.tenantId).catch(() => []),
            ])
            
            const timeoutPromise = new Promise<[string[], string[]]>((resolve) => {
              setTimeout(() => resolve([[], []]), RBAC_FETCH_TIMEOUT)
            })
            
            const [fetchedRoles, fetchedPermissions] = await Promise.race([
              rbacPromise,
              timeoutPromise,
            ])
            
            if (fetchedRoles.length > 0) {
              roles = fetchedRoles
            }
            if (fetchedPermissions.length > 0) {
              permissions = fetchedPermissions
            }
          } catch (error) {
            console.warn('[LOGIN] RBAC fetch failed, using legacy role')
          }
        }
      } catch (error) {
        // Silently fail - use legacy role
        console.warn('[LOGIN] RBAC check failed, using legacy role')
      }
    }
    
    console.log('[LOGIN] Roles and permissions resolved', { 
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      usingLegacyRole: roles.length > 0 && roles[0] === user.role,
    })

    // Step 9: Generate JWT tokens (Phase 1: Enhanced JWT)
    step = 'generate_token'
    console.log('[LOGIN] Step 9: Generating JWT tokens...', { 
      userId: user.id,
      tenantId: user.tenantId || 'none',
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      hasLicensedModules: !!(user.tenant?.licensedModules?.length),
    })
    
    let token: string
    let refreshToken: string
    
    try {
      // Generate access token with roles, permissions, and modules
      token = signToken({
        sub: user.id,
        email: user.email,
        tenant_id: user.tenantId || '',
        tenant_slug: user.tenant?.subdomain || undefined,
        roles: roles,
        permissions: permissions,
        modules: user.tenant?.licensedModules || [],
        // Legacy fields for backward compatibility
        userId: user.id,
        tenantId: user.tenantId || '',
        role: roles[0] || user.role || 'user',
        licensedModules: user.tenant?.licensedModules || [],
        subscriptionTier: user.tenant?.subscriptionTier || 'free',
      })
      
      // Generate refresh token
      refreshToken = signRefreshToken({
        sub: user.id,
        tenant_id: user.tenantId || '',
        type: 'refresh',
      })
      
      console.log('[LOGIN] Tokens generated successfully', { 
        tokenLength: token.length,
        refreshTokenLength: refreshToken.length,
      })
    } catch (tokenError) {
      console.error('[LOGIN] Token generation failed:', {
        error: tokenError instanceof Error ? tokenError.message : String(tokenError),
        stack: tokenError instanceof Error ? tokenError.stack : undefined,
        hasJwtSecret: !!process.env.JWT_SECRET,
      })
      throw new Error(`Token generation error: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`)
    }

    // Step 10: Warm cache for tenant (async, non-blocking)
    step = 'warm_cache'
    if (user.tenantId) {
      // OPTIMIZATION: Skip cache warming for small tenants to improve login speed
      // Only warm cache if tenant has significant data (prevents unnecessary queries)
      try {
        const [contactCount, dealCount] = await Promise.all([
          prisma.contact.count({ where: { tenantId: user.tenantId } }),
          prisma.deal.count({ where: { tenantId: user.tenantId } }),
        ])
        
        const totalRecords = contactCount + dealCount
        
        // Only warm cache if tenant has more than 20 records
        // This prevents slow cache warming for new/small tenants
        if (totalRecords > 20) {
          console.log('[LOGIN] Step 10: Warming cache for tenant...', { 
            tenantId: user.tenantId,
            totalRecords,
          })
          // Warm cache asynchronously - don't block login response
          warmTenantCache(user.tenantId).catch((cacheError) => {
            // Non-critical error - log but don't fail login
            console.warn('[LOGIN] Cache warming failed (non-critical):', {
              error: cacheError instanceof Error ? cacheError.message : String(cacheError),
              tenantId: user.tenantId,
            })
          })
        } else {
          console.log('[LOGIN] Skipping cache warming for small tenant', { 
            tenantId: user.tenantId,
            totalRecords,
          })
        }
      } catch (countError) {
        // If count fails, skip cache warming (non-critical)
        console.warn('[LOGIN] Failed to check tenant size, skipping cache warming:', {
          error: countError instanceof Error ? countError.message : String(countError),
          tenantId: user.tenantId,
        })
      }
    }

    // Step 11: Prepare response
    step = 'prepare_response'
    console.log('[LOGIN] Step 10: Preparing response...')
    const duration = Date.now() - startTime
    console.log('[LOGIN] ✅ Login successful', { 
      email: validated.email, 
      userId: user.id,
      tenantId: user.tenantId,
      duration: `${duration}ms`,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roles[0] || user.role,
        roles: roles,
        avatar: user.avatar,
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
        plan: user.tenant.plan,
        licensedModules: user.tenant.licensedModules || [],
        subscriptionTier: user.tenant.subscriptionTier || 'free',
      } : null,
      token,
      refreshToken,
      permissions: permissions,
      modules: user.tenant?.licensedModules || [],
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : typeof error
    
    // Check for specific error types
    if (error instanceof z.ZodError) {
      console.error('[LOGIN] ❌ Validation error:', {
        step,
        errors: error.errors,
        duration: `${duration}ms`,
      })
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Log comprehensive error details
    const errorLog: Record<string, any> = {
      step,
      errorName,
      message: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
      // Environment info
      nodeEnv: isDevelopment() ? 'development' : 'production',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
    
    // Include error object details if available
    if (error && typeof error === 'object' && 'code' in error) {
      errorLog.code = (error as any).code
    }
    if (error && typeof error === 'object' && 'meta' in error) {
      errorLog.meta = (error as any).meta
    }
    if (isDevelopment()) {
      errorLog.fullError = error
    }
    
    console.error('[LOGIN] ❌ Error occurred:', errorLog)
    
    // Return error response with appropriate detail level
    const responseMessage = isDevelopment()
      ? `${errorMessage} (failed at step: ${step})`
      : errorMessage.includes('Database') || errorMessage.includes('database')
        ? 'Database connection error. Please try again later.'
        : 'An error occurred during login'
    
    return NextResponse.json(
      { 
        error: 'Login failed',
        message: responseMessage,
        ...(isDevelopment() && {
          step,
          errorName,
          stack: errorStack,
        }),
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

