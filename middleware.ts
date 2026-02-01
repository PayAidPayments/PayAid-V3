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

    // Handle case-insensitive module routes (e.g., /HR -> /hr)
    // Known module IDs that should be lowercase
    const moduleIds = ['crm', 'hr', 'sales', 'finance', 'marketing', 'projects', 'analytics', 
                       'accounting', 'communication', 'inventory', 'retail', 'healthcare', 
                       'education', 'manufacturing', 'ai-studio', 'ai-cofounder', 'voice-agents']
    
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length > 0) {
      const firstPart = pathParts[0].toLowerCase()
      // If the first part is a known module but the pathname has uppercase, redirect to lowercase
      if (moduleIds.includes(firstPart) && pathParts[0] !== firstPart) {
        const correctedPath = '/' + firstPart + (pathname.endsWith('/') ? '/' : '') + 
                            (pathParts.length > 1 ? '/' + pathParts.slice(1).join('/') : '')
        const url = request.nextUrl.clone()
        url.pathname = correctedPath
        return NextResponse.redirect(url)
      }
    }

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
        
        // For CRM and HR specifically, always allow through - client-side will handle auth
        // This prevents redirect loops and allows users to access modules even if token is expired
        if ((moduleId === 'crm' || moduleId === 'hr') && pathname.match(/^\/(crm|hr)\/[^\/]+\//)) {
          // Allow CRM and HR routes through - client-side will handle auth checks
          return NextResponse.next()
        }
        
        if (!token) {
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
          // For non-CRM modules, redirect to login on token verification failure
          // For CRM, we already allowed it through above
          if (moduleId !== 'crm') {
            return NextResponse.redirect(new URL('/login', request.url))
          }
          // For CRM, allow through even if token verification fails
          // Client-side will handle re-authentication
          return NextResponse.next()
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
    '/CRM/:path*',
    '/hr/:path*',
    '/HR/:path*',
    '/accounting/:path*',
    '/Accounting/:path*',
    '/communication/:path*',
    '/Communication/:path*',
    '/reports/:path*',
    '/Reports/:path*',
    '/payments/:path*',
    '/Payments/:path*',
    '/workflow/:path*',
    '/Workflow/:path*',
    '/analytics/:path*',
    '/Analytics/:path*',
    '/sales/:path*',
    '/Sales/:path*',
    '/finance/:path*',
    '/Finance/:path*',
    '/marketing/:path*',
    '/Marketing/:path*',
    '/projects/:path*',
    '/Projects/:path*',
  ],
}
