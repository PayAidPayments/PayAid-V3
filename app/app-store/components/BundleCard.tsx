'use client'

import { useCart } from '@/lib/stores/cart'

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

interface BundleCardProps {
  bundle: Bundle
}

const moduleIcons: Record<string, string> = {
  crm: '👥',
  finance: '💰',
  invoicing: '📄',
  accounting: '💰',
  hr: '👔',
  communication: '💬',
  inventory: '📦',
  sales: '🛒',
  projects: '📋',
  productivity: '📄',
  whatsapp: '💬',
  analytics: '📊',
}

export default function BundleCard({ bundle }: BundleCardProps) {
  const { addToCart } = useCart()

  const handlePurchase = () => {
    addToCart({
      type: 'bundle',
      bundleId: bundle.id,
      name: bundle.name,
      price: bundle.bundlePrice,
      modules: bundle.modules,
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-2 ${
      bundle.mostPopular ? 'border-blue-500' : 'border-gray-200'
    } relative`}>
      {bundle.mostPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {/* Bundle Name */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{bundle.name}</h3>
      <p className="text-gray-600 mb-4">{bundle.description}</p>

      {/* Included Modules */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Includes:</p>
        <div className="flex flex-wrap gap-2">
          {bundle.modules.map((moduleId) => (
            <div
              key={moduleId}
              className="flex items-center bg-gray-50 px-3 py-1 rounded-lg"
            >
              <span className="mr-2">{moduleIcons[moduleId] || '📦'}</span>
              <span className="text-sm font-medium text-gray-700 capitalize">
                {moduleId}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-4">
        {bundle.individualPrice > 0 && (
          <div className="text-sm text-gray-500 mb-1">
            Individual: <span className="line-through">₹{bundle.individualPrice.toLocaleString()}/mo</span>
          </div>
        )}
        <div className="text-3xl font-bold text-gray-900">
          ₹{bundle.bundlePrice.toLocaleString()}
          <span className="text-lg font-normal text-gray-500">/month</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Billed annually (₹{Math.round(bundle.bundlePrice * 12 * 0.8).toLocaleString()}/year)
        </div>
        {bundle.savings > 0 && (
          <div className="text-green-600 font-semibold mt-1">
            Save ₹{bundle.savings.toLocaleString()}/month
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={handlePurchase}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
          bundle.mostPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Get This Bundle
      </button>
    </div>
  )
}

