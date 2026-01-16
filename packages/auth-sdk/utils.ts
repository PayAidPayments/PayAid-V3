/**
 * Auth utility functions
 */

/**
 * Check if a token is valid (basic validation)
 */
export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiry
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(token: string | null): Date | null {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is about to expire (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true;
  
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  const fiveMinutes = 5 * 60 * 1000;
  return expiry.getTime() - Date.now() < fiveMinutes;
}

