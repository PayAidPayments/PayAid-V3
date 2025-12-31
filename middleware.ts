import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware - just pass through all requests
// Authentication and routing will be handled by page components
// Note: Middleware runs in Edge Runtime by default in Next.js
export async function middleware(request: NextRequest) {
  try {
    // Validate request object exists
    if (!request || !request.nextUrl) {
      console.error('Invalid request object in middleware')
      return NextResponse.next()
    }

    // Simply let all requests proceed
    // Page components will handle authentication and redirects
    return NextResponse.next()
  } catch (error) {
    // Log error in production (Vercel will capture this)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Middleware error:', errorMessage)
    
    // Return a response to prevent middleware failure
    // Always return NextResponse.next() to avoid breaking the request
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}
