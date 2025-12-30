/**
 * Helper function to format status labels for display
 */
export function formatStatusLabel(status: string): string {
  if (!status) return ''
  
  // Convert snake_case to Title Case
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get dynamic title based on entity type and status filter
 */
export function getDynamicTitle(entityType: string, statusFilter: string): string {
  if (!statusFilter || statusFilter === '' || statusFilter === 'all') {
    return `All ${entityType}`
  }
  
  const formattedStatus = formatStatusLabel(statusFilter)
  return `${formattedStatus} ${entityType}`
}

/**
 * Get dynamic description based on entity type and status filter
 */
export function getDynamicDescription(entityType: string, statusFilter: string): string {
  if (!statusFilter || statusFilter === '' || statusFilter === 'all') {
    return `View and manage all your ${entityType.toLowerCase()}`
  }
  
  const formattedStatus = formatStatusLabel(statusFilter)
  return `View and manage your ${formattedStatus.toLowerCase()} ${entityType.toLowerCase()}`
}

