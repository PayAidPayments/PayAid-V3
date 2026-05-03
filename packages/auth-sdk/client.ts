/**
 * Auth Client - Server-side auth utilities
 * 
 * IMPORTANT: This file contains server-only code.
 * Only import from this file in API routes or server components.
 * For client components, use useAuth() hook from './useAuth'
 */

import { NextRequest } from 'next/server';

/**
 * Get session token from request (for API routes)
 * Extracts token from Authorization header or cookies
 */
export async function getSessionToken(request?: NextRequest): Promise<string | null> {
  // If request is provided (API route), get token from headers
  if (request) {
    // Try Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Fallback to cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      if (cookies.token) {
        return cookies.token;
      }
    }
    
    return null;
  }

  // Server-side: get from cookies (for server components)
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      return token || null;
    } catch (error) {
      // If cookies() fails, return null
      return null;
    }
  }

  // Client-side: return null, use useAuth() hook instead
  return null;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  return !!token;
}

/**
 * Get user profile from token (server-side)
 * This would typically verify the JWT and return user data
 */
export async function getUserProfile(): Promise<any | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    // Verify token and get user data
    // In production, this would verify the JWT signature
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user || null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }

  return null;
}

/**
 * Redirect to login page
 */
export function redirectToLogin(redirectUrl?: string): void {
  if (typeof window === 'undefined') return;
  
  const loginUrl = `/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`;
  window.location.href = loginUrl;
}

