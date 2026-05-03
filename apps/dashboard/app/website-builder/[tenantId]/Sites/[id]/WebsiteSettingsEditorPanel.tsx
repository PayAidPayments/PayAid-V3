'use client'

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { mergeWebsiteSiteSchemaJson, type WebsiteSiteSchemaJson } from '@/lib/website-builder/site-schema'

type Props = {
  siteId: string
  token: string | null | undefined
  schemaJson: WebsiteSiteSchemaJson | undefined
  onSaved: () => void
}

function hydrateFromSchema(schemaJson: WebsiteSiteSchemaJson | undefined) {
  const header = schemaJson?.settings?.header
  const hero = schemaJson?.settings?.hero
  const seo = schemaJson?.settings?.seo
  const contact = schemaJson?.settings?.contact
  return {
    headerSiteName: header?.siteName ?? '',
    headerLogoUrl: header?.logoUrl ?? '',
    headerSticky: Boolean(header?.sticky),
    heroHeadline: hero?.headline ?? '',
    heroSubheadline: hero?.subheadline ?? '',
    heroPrimaryCtaLabel: hero?.primaryCta?.label ?? '',
    heroPrimaryCtaHref: hero?.primaryCta?.href ?? '',
    heroSecondaryCtaLabel: hero?.secondaryCta?.label ?? '',
    heroSecondaryCtaHref: hero?.secondaryCta?.href ?? '',
    seoTitleSuffix: seo?.titleSuffix ?? '',
    seoDefaultDescription: seo?.defaultDescription ?? '',
    seoDefaultOgImage: seo?.defaultOgImage ?? '',
    contactEmail: contact?.email ?? '',
    contactPhone: contact?.phone ?? '',
    contactAddressText: (contact?.addressLines ?? []).join('\n'),
  }
}

type FormState = ReturnType<typeof hydrateFromSchema>

function markDirty(
  setDirty: (v: boolean) => void,
  setSaveInfo: (v: string) => void,
  setForm: Dispatch<SetStateAction<FormState>>,
  patch: Partial<FormState>
) {
  setDirty(true)
  setSaveInfo('')
  setForm((p) => ({ ...p, ...patch }))
}

export function WebsiteSettingsEditorPanel({ siteId, token, schemaJson, onSaved }: Props) {
  const [dirty, setDirty] = useState(false)
  const [saveInfo, setSaveInfo] = useState('')
  const [form, setForm] = useState(() => hydrateFromSchema(schemaJson))

  useEffect(() => {
    if (dirty) return
    setForm(hydrateFromSchema(schemaJson))
  }, [schemaJson, dirty])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Not signed in')
      const addressLines = form.contactAddressText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const nextSchema = mergeWebsiteSiteSchemaJson(schemaJson, {
        settings: {
          header: {
            siteName: form.headerSiteName.trim(),
            logoUrl: form.headerLogoUrl.trim(),
            sticky: form.headerSticky,
          },
          hero: {
            headline: form.heroHeadline.trim(),
            subheadline: form.heroSubheadline.trim(),
            primaryCta: {
              label: form.heroPrimaryCtaLabel.trim(),
              href: form.heroPrimaryCtaHref.trim(),
            },
            secondaryCta: {
              label: form.heroSecondaryCtaLabel.trim(),
              href: form.heroSecondaryCtaHref.trim(),
            },
          },
          seo: {
            titleSuffix: form.seoTitleSuffix.trim(),
            defaultDescription: form.seoDefaultDescription.trim(),
            defaultOgImage: form.seoDefaultOgImage.trim(),
          },
          contact: {
            email: form.contactEmail.trim(),
            phone: form.contactPhone.trim(),
            addressLines,
          },
        },
      })
      const response = await fetch(`/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schemaJson: nextSchema }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to save editor settings')
      }
      return response.json()
    },
    onSuccess: () => {
      setDirty(false)
      setSaveInfo('Editor settings saved.')
      onSaved()
    },
    onError: (e: Error) => {
      setSaveInfo(e.message || 'Save failed.')
    },
  })

  const resetLocal = useCallback(() => {
    setForm(hydrateFromSchema(schemaJson))
    setDirty(false)
    setSaveInfo('')
  }, [schemaJson])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor settings</CardTitle>
        <CardDescription>
          Values live in <span className="font-mono text-xs">schemaJson.settings</span> (header, hero, SEO, contact).
          Separate from site-level meta title/description in Edit site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Header block</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="header-site-name">
                Site name (header)
              </label>
              <Input
                id="header-site-name"
                value={form.headerSiteName}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { headerSiteName: e.target.value })}
                placeholder="Shown in nav / header"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="header-logo-url">
                Logo URL
              </label>
              <Input
                id="header-logo-url"
                value={form.headerLogoUrl}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { headerLogoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="header-sticky"
                type="checkbox"
                checked={form.headerSticky}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { headerSticky: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="header-sticky" className="text-sm font-medium text-gray-700 cursor-pointer">
                Sticky header
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Hero block</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="hero-headline">
                Headline
              </label>
              <Input
                id="hero-headline"
                value={form.heroHeadline}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { heroHeadline: e.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="hero-subheadline">
                Subheadline
              </label>
              <textarea
                id="hero-subheadline"
                value={form.heroSubheadline}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { heroSubheadline: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[72px]"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="hero-primary-cta-label">
                Primary CTA label
              </label>
              <Input
                id="hero-primary-cta-label"
                value={form.heroPrimaryCtaLabel}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { heroPrimaryCtaLabel: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="hero-primary-cta-href">
                Primary CTA link
              </label>
              <Input
                id="hero-primary-cta-href"
                value={form.heroPrimaryCtaHref}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { heroPrimaryCtaHref: e.target.value })}
                placeholder="/contact or https://..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="hero-secondary-cta-label">
                Secondary CTA label
              </label>
              <Input
                id="hero-secondary-cta-label"
                value={form.heroSecondaryCtaLabel}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { heroSecondaryCtaLabel: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="hero-secondary-cta-href">
                Secondary CTA link
              </label>
              <Input
                id="hero-secondary-cta-href"
                value={form.heroSecondaryCtaHref}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { heroSecondaryCtaHref: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">SEO block</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="seo-title-suffix">
                Title suffix
              </label>
              <Input
                id="seo-title-suffix"
                value={form.seoTitleSuffix}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { seoTitleSuffix: e.target.value })}
                placeholder=" e.g. | My Brand"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="seo-default-desc">
                Default description
              </label>
              <textarea
                id="seo-default-desc"
                value={form.seoDefaultDescription}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { seoDefaultDescription: e.target.value })}
                placeholder="Fallback description for pages without their own."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[72px]"
                rows={3}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="seo-og-image">
                Default OG image URL
              </label>
              <Input
                id="seo-og-image"
                value={form.seoDefaultOgImage}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { seoDefaultOgImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Contact block</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="contact-email">
                Email
              </label>
              <Input
                id="contact-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { contactEmail: e.target.value })}
                placeholder="hello@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="contact-phone">
                Phone
              </label>
              <Input
                id="contact-phone"
                value={form.contactPhone}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { contactPhone: e.target.value })}
                placeholder="+1 ..."
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="contact-address">
                Address (one line per row)
              </label>
              <textarea
                id="contact-address"
                value={form.contactAddressText}
                onChange={(e) => markDirty(setDirty, setSaveInfo, setForm, { contactAddressText: e.target.value })}
                placeholder={'123 Main St\nCity, ST 00000'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[72px]"
                rows={3}
              />
            </div>
          </div>
        </div>

        <details className="rounded-md border border-gray-100 bg-gray-50/80 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-gray-800">
            Saved settings (read-only, from server)
          </summary>
          <p className="mt-2 text-xs text-gray-500">
            Confirms what is persisted in <span className="font-mono">schemaJson.settings</span> after the last fetch.
          </p>
          <pre className="mt-2 max-h-52 overflow-auto rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 whitespace-pre-wrap break-words">
            {JSON.stringify(schemaJson?.settings ?? {}, null, 2)}
          </pre>
        </details>

        {saveInfo && (
          <p
            className={`text-sm ${
              /fail|not signed/i.test(saveInfo) ? 'text-red-600' : 'text-green-700'
            }`}
          >
            {saveInfo}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => saveMutation.mutate()} disabled={!token || saveMutation.isPending || !dirty}>
            {saveMutation.isPending ? 'Saving…' : 'Save editor settings'}
          </Button>
          <Button type="button" variant="outline" onClick={resetLocal} disabled={saveMutation.isPending || !dirty}>
            Discard changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
