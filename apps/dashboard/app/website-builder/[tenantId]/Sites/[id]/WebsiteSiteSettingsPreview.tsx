'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WebsiteSettingsPublicLayout } from '@/lib/website-builder/settings-public-layout'
import type { WebsiteEditorSettingsBlocks } from '@/lib/website-builder/site-schema'

type Props = {
  siteName: string
  metaTitle?: string | null
  metaDescription?: string | null
  settings: WebsiteEditorSettingsBlocks | undefined
}

/**
 * Dashboard wrapper around {@link WebsiteSettingsPublicLayout} (shared with public `/sites/lp/[slug]`).
 */
export function WebsiteSiteSettingsPreview({ siteName, metaTitle, metaDescription, settings }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings preview</CardTitle>
        <CardDescription>
          Read-only layout from saved <span className="font-mono text-xs">schemaJson.settings</span>. When the site is
          published (LandingPage bridge), the same blocks are served at{' '}
          <span className="font-mono text-xs">/sites/lp/&lt;slug&gt;</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WebsiteSettingsPublicLayout
          variant="dashboard"
          siteName={siteName}
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          settings={settings}
        />
      </CardContent>
    </Card>
  )
}
