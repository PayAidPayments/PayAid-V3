'use client'

import BundleCard from './BundleCard'

interface Bundle {
  id: string
  name: string
  description: string
  modules: string[]
  individualPrice: number
  bundlePrice: number
  savings: number
  mostPopular?: boolean
}

interface BundleSectionProps {
  bundles: Bundle[]
}

export default function BundleSection({ bundles }: BundleSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {bundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  )
}

