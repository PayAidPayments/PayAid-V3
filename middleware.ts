import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, type JWTPayload } from '@/lib/auth/jwt'
import { getModule } from '@/lib/modules/moduleRegistry'

/**
 * Phase 2: Enhanced Middleware with Module Route Protection
 * Handles authentication and module access checks
 */

export async function middleware(request: NextRequest) {
  try {
    // Validate request object exists
    if (!request || !request.nextUrl) {
      console.error('Invalid request object in middleware')
      return NextResponse.next()
    }

    const pathname = request.nextUrl.pathname

    // Skip middleware for public routes
    const publicRoutes = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico']
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Admin routes - check for super admin
    if (pathname.startsWith('/admin')) {
      const token = getTokenFromRequest(request)
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      try {
        const decoded = verifyToken(token)
        const isSuperAdmin = decoded.roles?.includes('super_admin') || 
                           decoded.role === 'super_admin'
        
        if (!isSuperAdmin) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Module routes - check module access
    // Skip base module routes (e.g., /crm, /sales) - they handle their own auth
    // Only check routes with tenantId (e.g., /crm/[tenantId]/Home)
    const moduleMatch = pathname.match(/^\/([^\/]+)/)
    if (moduleMatch) {
      const moduleId = moduleMatch[1]
      const module = getModule(moduleId)
      
      if (module) {
        // Allow base module routes (e.g., /crm, /sales) to pass through
        // These are entry points that handle their own auth logic
        const isBaseModuleRoute = pathname === `/${moduleId}` || pathname === `/${moduleId}/`
        if (isBaseModuleRoute) {
          return NextResponse.next()
        }
        
        // For routes with tenantId (e.g., /crm/[tenantId]/Home), check access
        const token = getTokenFromRequest(request)
        if (!token) {
          // For CRM specifically, allow through if it's a valid route structure
          // The client-side entry point will handle auth checks
          // This prevents redirect loops when cookie isn't set yet
          if (moduleId === 'crm' && pathname.match(/^\/crm\/[^\/]+\//)) {
            // Allow CRM routes through - client-side will handle auth
            return NextResponse.next()
          }
          return NextResponse.redirect(new URL('/login', request.url))
        }

        try {
          const decoded = verifyToken(token)
          
          // Check if module is in user's enabled modules
          // Note: Full check requires DB query, so we do basic check here
          // Full validation happens in API routes
          // For CRM, always allow (it's a core module)
          const userModules = decoded.modules || decoded.licensedModules || []
          if (moduleId !== 'crm' && !userModules.includes(moduleId)) {
            // Module not enabled - redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }

          // Check admin-only routes
          if (module.admin_only_routes?.some(route => pathname.startsWith(route))) {
            const isAdmin = decoded.roles?.includes('admin') || 
                           decoded.roles?.includes('Admin') ||
                           decoded.role === 'admin'
            if (!isAdmin) {
              return NextResponse.redirect(new URL(`/${moduleId}`, request.url))
            }
          }
        } catch {
          return NextResponse.redirect(new URL('/login', request.url))
        }
      }
    }

    // All other routes - let through
    return NextResponse.next()
  } catch (error) {
    // Log error in production (Vercel will capture this)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Middleware error:', errorMessage)
    
    // Return a response to prevent middleware failure
    return NextResponse.next()
  }
}

/**
 * Extract token from request (cookie or header)
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Try authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try cookie
  const token = request.cookies.get('token')?.value
  if (token) {
    return token
  }

  return null
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/crm/:path*',
    '/hr/:path*',
    '/accounting/:path*',
    '/communication/:path*',
    '/reports/:path*',
    '/payments/:path*',
    '/workflow/:path*',
    '/analytics/:path*',
  ],
}
