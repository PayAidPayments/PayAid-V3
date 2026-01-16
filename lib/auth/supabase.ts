/**
 * Supabase Auth Integration
 * Provides authentication using Supabase Auth instead of JWT
 */

import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/db/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using JWT fallback.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface SupabaseUser {
  id: string
  email: string
  name?: string
  avatar?: string
  tenantId?: string
  role?: string
  licensedModules?: string[]
  subscriptionTier?: string
}

/**
 * Get user from Supabase session and sync with database
 */
export async function getUserFromSession(accessToken: string): Promise<SupabaseUser | null> {
  if (!supabase) {
    return null
  }

  try {
    // Set the session token
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !supabaseUser) {
      return null
    }

    // Find user in database and sync
    const dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
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
      }
    })

    if (!dbUser) {
      // User exists in Supabase but not in database - create it
      // This can happen during migration
      return null
    }

    // Note: If you want to sync Supabase user ID, add supabaseUserId field to User model
    // For now, we match by email which is sufficient

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || undefined,
      avatar: dbUser.avatar || undefined,
      tenantId: dbUser.tenantId || undefined,
      role: dbUser.role,
      licensedModules: dbUser.tenant?.licensedModules || [],
      subscriptionTier: dbUser.tenant?.subscriptionTier || 'free',
    }
  } catch (error) {
    console.error('Error getting user from Supabase session:', error)
    return null
  }
}

/**
 * Sign in with email and password using Supabase
 */
export async function signInWithPassword(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed')
  }

  // Sync with database
  const dbUser = await prisma.user.findUnique({
    where: { email: data.user.email! },
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
    }
  })

  if (!dbUser) {
    throw new Error('User not found in database')
  }

  // Update last login
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { lastLoginAt: new Date() }
  })

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar,
      role: dbUser.role,
    },
    tenant: dbUser.tenant ? {
      id: dbUser.tenant.id,
      name: dbUser.tenant.name,
      subdomain: dbUser.tenant.subdomain,
      plan: dbUser.tenant.plan,
      licensedModules: dbUser.tenant.licensedModules || [],
      subscriptionTier: dbUser.tenant.subscriptionTier || 'free',
    } : null,
    session: data.session,
    accessToken: data.session.access_token,
  }
}

/**
 * Sign out from Supabase
 */
export async function signOut() {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

/**
 * Check if Supabase Auth is enabled
 */
export function isSupabaseEnabled(): boolean {
  return !!supabase
}

