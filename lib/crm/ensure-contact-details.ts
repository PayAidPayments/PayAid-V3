/**
 * Idempotent backfill of missing CRM contact fields so list/detail UIs always have sensible values.
 * Only fills blanks; never overwrites user-provided data.
 */
import { prisma } from '@/lib/db/prisma'

export function shouldBackfillContactDetails(tenant: { name: string | null; subdomain: string | null } | null): boolean {
  if (!tenant) return false
  return (
    process.env.NODE_ENV === 'development' ||
    tenant.subdomain === 'demo' ||
    (tenant.name && /demo business/i.test(tenant.name)) ||
    process.env.PAYAID_CONTACT_DETAIL_BACKFILL === '1' ||
    process.env.NEXT_PUBLIC_CRM_AUTO_SEED === '1'
  )
}

function placeholderEmail(contactId: string): string {
  return `noreply+${contactId.replace(/[^a-z0-9]/gi, '').slice(0, 12)}@contacts.internal.payaid`
}

function placeholderPhone(contactId: string): string {
  let n = 0
  for (let i = 0; i < contactId.length; i++) n = (n * 31 + contactId.charCodeAt(i)) >>> 0
  const digits = String(n % 100000000).padStart(8, '0')
  return `+91-9${digits}`
}

export async function ensureMinimalContactDetails(tenantId: string): Promise<{ updated: number }> {
  const rows = await prisma.contact.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      source: true,
      address: true,
    },
  })

  let updated = 0
  for (const c of rows) {
    const data: Record<string, string> = {}
    const name = (c.name || '').trim() || 'Unnamed contact'

    if (!c.email?.trim()) {
      data.email = placeholderEmail(c.id)
    }
    if (!c.phone?.trim()) {
      data.phone = placeholderPhone(c.id)
    }
    if (!c.company?.trim()) {
      data.company = name
    }
    if (!c.city?.trim()) {
      data.city = 'Bangalore'
    }
    if (!c.state?.trim()) {
      data.state = 'Karnataka'
    }
    if (!c.country?.trim()) {
      data.country = 'India'
    }
    if (!c.postalCode?.trim()) {
      data.postalCode = '560001'
    }
    if (!c.source?.trim()) {
      data.source = 'Direct'
    }
    if (!c.address?.trim()) {
      data.address = `${name} — on file`
    }

    if (Object.keys(data).length === 0) continue

    try {
      await prisma.contact.update({
        where: { id: c.id },
        data,
      })
      updated++
    } catch (e) {
      console.warn('[ensureMinimalContactDetails] skip contact', c.id, (e as Error)?.message)
    }
  }

  return { updated }
}
