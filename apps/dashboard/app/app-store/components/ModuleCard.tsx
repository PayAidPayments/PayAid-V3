'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/stores/cart'
import { ModuleDefinition } from '@prisma/client'

interface ModuleCardProps {
  module: ModuleDefinition
  isLicensed?: boolean
}

export default function ModuleCard({ module, isLicensed = false }: ModuleCardProps) {
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional'>('starter')
  const { addToCart } = useCart()

  const price = selectedTier === 'starter' 
    ? Number(module.starterPrice) 
    : Number(module.professionalPrice)

  const handleAddToCart = () => {
    addToCart({
      type: 'module',
      moduleId: module.moduleId,
      tier: selectedTier,
      name: module.displayName,
      price: price,
    })
  }

  const handleStartTrial = () => {
    // TODO: Implement free trial logic
    console.log('Start trial for', module.moduleId)
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      {/* Module Icon & Name */}
      <div className="flex items-center mb-4">
        {module.icon && (
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-2xl">{module.icon}</span>
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{module.displayName}</h3>
          <p className="text-sm text-gray-500">{module.moduleId}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-3">{module.description}</p>

      {/* Features */}
      {module.features && module.features.length > 0 && (
        <ul className="mb-4 space-y-2">
          {module.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Pricing Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setSelectedTier('starter')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
              selectedTier === 'starter'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Starter
          </button>
          <button
            onClick={() => setSelectedTier('professional')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
              selectedTier === 'professional'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Professional
          </button>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-900">₹{price.toLocaleString()}</span>
          <span className="text-gray-500 text-sm ml-1">/month</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {isLicensed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <span className="text-green-700 font-medium text-sm">✓ Already Purchased</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Add to Cart
            </button>
            <button
              onClick={handleStartTrial}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Start Free Trial
            </button>
          </>
        )}
        <Link
          href={`/app-store/${module.moduleId}`}
          className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Learn More →
        </Link>
      </div>
    </div>
  )
}

