import { NextRequest, NextResponse } from 'next/server'
import { signInWithPassword, isSupabaseEnabled } from '@/lib/auth/supabase'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * POST /api/auth/login-supabase
 * Login using Supabase Auth (if enabled) or fallback to JWT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    // Try Supabase Auth first if enabled
    if (isSupabaseEnabled()) {
      try {
        const result = await signInWithPassword(validated.email, validated.password)
        
        return NextResponse.json({
          user: result.user,
          tenant: result.tenant,
          session: result.session,
          accessToken: result.accessToken,
          authMethod: 'supabase',
        })
      } catch (supabaseError: any) {
        // If Supabase fails, fall back to JWT
        console.warn('Supabase login failed, falling back to JWT:', supabaseError.message)
      }
    }

    // Fallback to JWT - redirect to existing login endpoint
    // This maintains backward compatibility
    const jwtResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validated),
    })
    
    const jwtData = await jwtResponse.json()
    return NextResponse.json({
      ...jwtData,
      authMethod: 'jwt',
    }, { status: jwtResponse.status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

