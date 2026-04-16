import { buildTasksListWhere, utcDayBounds } from '@/lib/crm/tasks-list-where'

describe('utcDayBounds', () => {
  it('returns UTC midnight start and end-of-day for a fixed reference', () => {
    const ref = new Date('2026-06-15T12:30:00.000Z')
    const { start, end } = utcDayBounds(ref)
    expect(start.toISOString()).toBe('2026-06-15T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-06-15T23:59:59.999Z')
  })
})

function sp(entries: Record<string, string>) {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(entries)) u.set(k, v)
  return u
}

describe('buildTasksListWhere', () => {
  const ref = new Date('2026-06-15T10:00:00.000Z')
  const tid = 'tenant_a'

  it('scopes to tenant only when no filters', () => {
    expect(buildTasksListWhere(tid, new URLSearchParams(), ref)).toEqual({ tenantId: tid })
  })

  it('adds open status filter', () => {
    const w = buildTasksListWhere(tid, sp({ status: 'open' }), ref) as { AND: unknown[] }
    expect(w.AND).toBeDefined()
    expect(w.AND[0]).toEqual({ tenantId: tid })
    expect(w.AND[1]).toEqual({ NOT: { status: { in: ['completed', 'cancelled'] } } })
  })

  it('adds overdue filter using reference day start', () => {
    const w = buildTasksListWhere(tid, sp({ status: 'overdue' }), ref) as { AND: unknown[] }
    expect(w.AND[0]).toEqual({ tenantId: tid })
    expect(w.AND[1]).toEqual({ NOT: { status: { in: ['completed', 'cancelled'] } } })
    expect(w.AND[2]).toEqual({
      dueDate: { not: null, lt: new Date('2026-06-15T00:00:00.000Z') },
    })
  })

  it('adds search OR on title and description', () => {
    const w = buildTasksListWhere(tid, sp({ search: '  Acme  ' }), ref) as { AND: unknown[] }
    expect(w.AND[1]).toEqual({
      OR: [
        { title: { contains: 'Acme', mode: 'insensitive' } },
        { description: { contains: 'Acme', mode: 'insensitive' } },
      ],
    })
  })

  it('adds explicit status for pending', () => {
    const w = buildTasksListWhere(tid, sp({ status: 'pending' }), ref) as { AND: unknown[] }
    expect(w.AND[1]).toEqual({ status: 'pending' })
  })
})
