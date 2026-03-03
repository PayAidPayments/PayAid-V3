/**
 * Phase A4: Substitute {{contact.name}}, {{deal.value}}, etc. in email/WhatsApp templates.
 */

export interface ContactContext {
  name?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
}

export interface DealContext {
  name?: string | null
  value?: number | null
  stage?: string | null
}

const CONTACT_KEYS = ['name', 'company', 'email', 'phone'] as const
const DEAL_KEYS = ['name', 'value', 'stage'] as const

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function substituteVariables(
  text: string,
  options: { contact?: ContactContext | null; deal?: DealContext | null }
): string {
  let out = text
  const { contact, deal } = options

  for (const key of CONTACT_KEYS) {
    const placeholder = `{{contact.${key}}}`
    const re = new RegExp(escapeRe(placeholder), 'gi')
    const value = contact?.[key] ?? ''
    out = out.replace(re, String(value))
  }

  for (const key of DEAL_KEYS) {
    const placeholder = `{{deal.${key}}}`
    const re = new RegExp(escapeRe(placeholder), 'gi')
    let value: string
    if (key === 'value' && deal?.value != null) {
      value = `₹${Number(deal.value).toLocaleString('en-IN')}`
    } else {
      value = deal?.[key] != null ? String(deal[key]) : ''
    }
    out = out.replace(re, value)
  }

  // Fallback for any remaining {{...}} to empty string
  out = out.replace(/\{\{[^}]*\}\}/g, '')

  return out
}
