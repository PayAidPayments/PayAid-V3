import { NextRequest, NextResponse } from 'next/server'

function clearTokenCookie(response: NextResponse): void {
  // Delete cookies by setting them to empty with past expiration
  response.cookies.set('payaid_token', '', {
    expires: new Date(0),
    domain: '.payaid.io',
    path: '/',
  })
  response.cookies.set('payaid_refresh_token', '', {
    expires: new Date(0),
    domain: '.payaid.io',
    path: '/',
  })
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  clearTokenCookie(response)
  
  const coreLogoutUrl = process.env.CORE_AUTH_URL || 'https://payaid.io'
  const logoutUrl = new URL('/logout', coreLogoutUrl)
  logoutUrl.searchParams.set('redirect', request.headers.get('referer') || '/')
  
  return NextResponse.redirect(logoutUrl.toString())
}

export async function GET(request: NextRequest) {
  return POST(request)
}
