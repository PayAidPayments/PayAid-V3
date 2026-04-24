/**
 * Single source of truth for Marketing module top bar.
 * Used in app/marketing/[tenantId]/layout.tsx.
 *
 * Campaigns: Email, WhatsApp, SMS as tabs. Social: Create Post, Create Image, Schedule, Social Listening.
 * Creative Studio: Product Studio, Model Studio, Image Ads, Ad Insights. Influencers = AI-Influencer.
 */

export interface MarketingTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getMarketingTopBarItems(tenantId: string): MarketingTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/marketing/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'Compose', href: `${base}/Studio` },
    { name: 'History', href: `${base}/History` },
    { name: 'Sequences', href: `${base}/Sequences` },
    { name: 'Ads', href: `${base}/Ads` },
    { name: 'Channels', href: `${base}/Social-Media` },
    { name: 'Creative Studio', href: `${base}/Creative-Studio` },
    { name: 'Segments', href: `${base}/Segments` },
    { name: 'Analytics', href: `${base}/Analytics` },
    { name: 'Influencers', href: `${base}/AI-Influencer` },
  ]
}
