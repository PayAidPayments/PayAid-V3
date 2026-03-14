// This is the callback route for Google OAuth
// It redirects to the main OAuth handler
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Redirect to the main OAuth handler
  const url = new URL('/api/auth/oauth/google', request.url)
  url.search = request.nextUrl.search
  
  return NextResponse.redirect(url)
}

