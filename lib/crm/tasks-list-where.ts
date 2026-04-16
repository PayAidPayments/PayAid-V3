/**
 * Prisma `where` builder for CRM task list filters (used by GET /api/tasks).
 * Extracted for unit tests and stable filter semantics.
 */

export function utcDayBounds(reference: Date = new Date()) {
  const start = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate(), 0, 0, 0, 0)
  )
  const end = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate(), 23, 59, 59, 999)
  )
  return { start, end }
}

/** Build Prisma-compatible where clause for tenant-scoped task lists. */
export function buildTasksListWhere(
  tenantId: string,
  sp: URLSearchParams,
  referenceDate: Date = new Date()
): Record<string, unknown> {
  const parts: Record<string, unknown>[] = [{ tenantId }]

  const module = sp.get('module')
  const priority = sp.get('priority')
  const contactId = sp.get('contactId')
  const assignedToId = sp.get('assignedToId')
  const search = sp.get('search')
  const dueDateFrom = sp.get('dueDateFrom')
  const dueDateTo = sp.get('dueDateTo')
  const status = sp.get('status')

  if (module) parts.push({ module })
  if (priority) parts.push({ priority })
  if (contactId) parts.push({ contactId })
  if (assignedToId) parts.push({ assignedToId })

  if (search?.trim()) {
    const q = search.trim()
    parts.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ],
    })
  }

  if (dueDateFrom || dueDateTo) {
    const range: { gte?: Date; lte?: Date } = {}
    if (dueDateFrom) range.gte = new Date(dueDateFrom)
    if (dueDateTo) range.lte = new Date(dueDateTo)
    parts.push({ dueDate: range })
  }

  if (status === 'overdue') {
    const { start } = utcDayBounds(referenceDate)
    parts.push({ NOT: { status: { in: ['completed', 'cancelled'] } } })
    parts.push({ dueDate: { not: null, lt: start } })
  } else if (status === 'open') {
    parts.push({ NOT: { status: { in: ['completed', 'cancelled'] } } })
  } else if (status === 'today') {
    const { start, end } = utcDayBounds(referenceDate)
    parts.push({ dueDate: { gte: start, lte: end } })
  } else if (status === 'completed_today') {
    const { start, end } = utcDayBounds(referenceDate)
    parts.push({ status: 'completed' })
    parts.push({ completedAt: { gte: start, lte: end } })
  } else if (status) {
    parts.push({ status })
  }

  return parts.length === 1 ? parts[0] : { AND: parts }
}
