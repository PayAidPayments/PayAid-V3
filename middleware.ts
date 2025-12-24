import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './lib/auth/jwt'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Skip if already has tenant identifier in path (e.g., /dashboard/[tenantId]/...)
  const pathParts = pathname.split('/').filter(Boolean)
  if (pathParts.length >= 2 && pathParts[0] === 'dashboard') {
    // Check if second part looks like a tenant ID (cuid format: ~25 chars, starts with letter)
    const secondPart = pathParts[1]
    // Tenant IDs are typically cuid format: starts with 'c' and is 25 chars
    // But we'll be more lenient: if it's long enough and not a known route, treat as tenantId
    const knownRoutes = ['contacts', 'deals', 'invoices', 'products', 'orders', 'tasks', 
      'settings', 'marketing', 'email', 'whatsapp', 'ai', 'chat', 'calls', 'websites', 
      'landing-pages', 'logos', 'checkout-pages', 'analytics', 'accounting', 'gst', 
      'reports', 'hr', 'industries', 'dashboards', 'events', 'email-templates']
    
    if (secondPart && secondPart.length > 15 && !knownRoutes.includes(secondPart)) {
      // Likely a tenant ID, proceed
      return NextResponse.next()
    }
  }

  // Try to get tenantId from JWT token in Authorization header
  const authHeader = request.headers.get('authorization')
  let tenantId: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7)
      const payload = verifyToken(token) as JWTPayload
      tenantId = payload.tenantId
    } catch (error) {
      // Token invalid or expired, will be handled by auth
    }
  }

  // Also try to get from cookies (for client-side navigation)
  if (!tenantId) {
    const tokenCookie = request.cookies.get('token')
    if (tokenCookie) {
      try {
        const payload = verifyToken(tokenCookie.value) as JWTPayload
        tenantId = payload.tenantId
      } catch (error) {
        // Token invalid
      }
    }
  }

  // If we have a tenantId and URL doesn't include it, rewrite the URL
  if (tenantId) {
    // Remove /dashboard prefix
    const remainingPath = pathname.replace(/^\/dashboard\/?/, '') || ''
    
    // Build new URL with tenantId
    const newPath = `/dashboard/${tenantId}${remainingPath ? '/' + remainingPath : ''}`
    const url = request.nextUrl.clone()
    url.pathname = newPath
    
    // Rewrite the request to include tenantId (this changes the URL in browser)
    return NextResponse.redirect(url)
  }

  // If no tenantId found, let it proceed (will be handled by auth)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}
