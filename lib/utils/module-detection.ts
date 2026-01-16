/**
 * Module Detection Utility
 * Detects which module the user is currently in based on the pathname
 */

export type ModuleId = 'crm' | 'finance' | 'sales' | 'marketing' | 'communication' | 'ai-studio' | 'productivity' | 'hr' | 'analytics' | 'projects' | 'inventory' | null

/**
 * Detect the current module from the pathname
 */
export function detectModuleFromPath(pathname: string): ModuleId {
  if (!pathname) return null

  // Remove tenant ID from path if present
  // Handles both /dashboard/contacts and /dashboard/[tenantId]/contacts
  let cleanPath = pathname
  
  // Check if pathname has tenant ID pattern: /dashboard/[tenantId]/...
  // Tenant ID can be UUID (36 chars) or other formats (20+ chars)
  // Match: /dashboard/[tenantId]/rest-of-path
  const tenantIdMatch = cleanPath.match(/^\/dashboard\/([a-z0-9-]{20,}|[a-f0-9-]{36})\/(.+)$/)
  
  if (tenantIdMatch) {
    // Has tenant ID: /dashboard/[tenantId]/contacts -> /dashboard/contacts
    cleanPath = `/dashboard/${tenantIdMatch[2]}`
  } else {
    // Check if it's just /dashboard/[tenantId] (no path after)
    const tenantOnlyMatch = cleanPath.match(/^\/dashboard\/([a-z0-9-]{20,}|[a-f0-9-]{36})$/)
    if (tenantOnlyMatch) {
      cleanPath = '/dashboard'
    }
    // If it doesn't match tenant pattern, assume it's already clean
    // (e.g., /dashboard/contacts)
  }
  
  // Ensure it starts with /dashboard
  if (!cleanPath.startsWith('/dashboard')) {
    return null
  }
  
  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[Module Detection]', { original: pathname, cleaned: cleanPath })
  }

  // CRM Module routes (Projects, Orders, Products removed - moved to separate modules)
  if (
    cleanPath.startsWith('/dashboard/contacts') ||
    cleanPath.startsWith('/dashboard/deals') ||
    cleanPath.startsWith('/dashboard/tasks')
  ) {
    return 'crm'
  }

  // Projects Module routes
  if (cleanPath.startsWith('/dashboard/projects')) {
    return 'projects'
  }

  // Inventory Module routes (Products moved here)
  if (cleanPath.startsWith('/dashboard/products')) {
    return 'inventory'
  }

  // Sales Module routes (Orders moved here)
  if (
    cleanPath.startsWith('/dashboard/orders') ||
    cleanPath.startsWith('/dashboard/landing-pages') ||
    cleanPath.startsWith('/dashboard/checkout-pages')
  ) {
    return 'sales'
  }

  // Finance Module routes
  if (
    cleanPath.startsWith('/dashboard/invoices') ||
    cleanPath.startsWith('/dashboard/accounting') ||
    cleanPath.startsWith('/dashboard/purchases') ||
    cleanPath.startsWith('/dashboard/gst') ||
    cleanPath.startsWith('/dashboard/billing')
  ) {
    return 'finance'
  }


  // Marketing Module routes
  if (
    cleanPath.startsWith('/dashboard/marketing') ||
    cleanPath.startsWith('/dashboard/media-library') ||
    cleanPath.startsWith('/dashboard/email-templates') ||
    cleanPath.startsWith('/dashboard/events')
  ) {
    return 'marketing'
  }

  // Communication Module routes
  if (
    cleanPath.startsWith('/dashboard/whatsapp') ||
    cleanPath.startsWith('/dashboard/email') ||
    cleanPath.startsWith('/dashboard/chat')
  ) {
    return 'communication'
  }

  // AI Studio Module routes
  if (
    cleanPath.startsWith('/dashboard/cofounder') ||
    cleanPath.startsWith('/dashboard/ai') ||
    cleanPath.startsWith('/dashboard/websites') ||
    cleanPath.startsWith('/dashboard/logos') ||
    cleanPath.startsWith('/dashboard/knowledge') ||
    cleanPath.startsWith('/dashboard/calls')
  ) {
    return 'ai-studio'
  }

  // Productivity Module routes
  if (
    cleanPath.startsWith('/dashboard/spreadsheets') ||
    cleanPath.startsWith('/dashboard/docs') ||
    cleanPath.startsWith('/dashboard/slides') ||
    cleanPath.startsWith('/dashboard/drive') ||
    cleanPath.startsWith('/dashboard/meet')
  ) {
    return 'productivity'
  }

  // HR Module routes
  if (cleanPath.startsWith('/dashboard/hr')) {
    return 'hr'
  }

  // Analytics Module routes
  if (
    cleanPath.startsWith('/dashboard/analytics') ||
    cleanPath.startsWith('/dashboard/reports') ||
    cleanPath.startsWith('/dashboard/dashboards')
  ) {
    return 'analytics'
  }

  // Default dashboard - no specific module
  if (cleanPath === '/dashboard' || cleanPath.startsWith('/dashboard/')) {
    return null // Main dashboard shows all modules
  }

  return null
}

/**
 * Get module name for display
 */
export function getModuleName(moduleId: ModuleId): string {
  const names: Record<string, string> = {
    'crm': 'CRM',
    'finance': 'Finance',
    'sales': 'Sales',
    'marketing': 'Marketing',
    'communication': 'Communication',
    'ai-studio': 'AI Studio',
    'productivity': 'Productivity',
    'hr': 'HR & Payroll',
    'analytics': 'Analytics',
    'projects': 'Projects',
    'inventory': 'Inventory',
  }
  return names[moduleId || ''] || 'PayAid'
}

