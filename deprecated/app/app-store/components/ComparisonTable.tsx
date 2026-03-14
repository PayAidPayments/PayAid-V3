'use client'

import { useState } from 'react'

interface Feature {
  name: string
  starter: boolean | string
  professional: boolean | string
  complete: boolean | string
  enterprise: boolean | string
}

const features: Feature[] = [
  { name: 'CRM Module', starter: true, professional: true, complete: true, enterprise: true },
  { name: 'Finance & Accounting', starter: true, professional: true, complete: true, enterprise: true },
  { name: 'HR Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'Communication Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'Inventory Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'Analytics Module', starter: true, professional: true, complete: true, enterprise: true },
  { name: 'AI Studio (Free)', starter: true, professional: true, complete: true, enterprise: true },
  { name: 'Marketing Module', starter: true, professional: true, complete: true, enterprise: true },
  { name: 'Max Users', starter: '5', professional: 'Unlimited', complete: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Billing', starter: 'Annual', professional: 'Annual', complete: 'Annual', enterprise: 'Custom' },
  { name: 'Support', starter: 'Email (Mon-Sat)', professional: 'Email (Mon-Sat)', complete: 'Priority', enterprise: 'Dedicated' },
]

const tiers = [
  { id: 'starter', name: 'Starter', price: '₹1,999', popular: false },
  { id: 'professional', name: 'Professional', price: '₹3,999', popular: true },
  { id: 'complete', name: 'Complete', price: 'Custom', popular: false },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', popular: false },
]

export default function ComparisonTable() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="text-green-600 text-xl">✓</span>
      ) : (
        <span className="text-gray-400 text-xl">✗</span>
      )
    }
    return <span className="text-gray-700">{value}</span>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-4 font-semibold text-gray-900 border-b">Feature</th>
            {tiers.map((tier) => (
              <th
                key={tier.id}
                className={`text-center p-4 font-semibold border-b ${
                  tier.popular ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-gray-900">{tier.name}</span>
                  <span className="text-blue-600 font-bold text-lg mt-1">{tier.price}</span>
                  {tier.popular && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-2">
                      Most Popular
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium text-gray-900">{feature.name}</td>
              <td className="p-4 text-center">{renderValue(feature.starter)}</td>
              <td className="p-4 text-center">{renderValue(feature.professional)}</td>
              <td className="p-4 text-center">{renderValue(feature.complete)}</td>
              <td className="p-4 text-center">{renderValue(feature.enterprise)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td className="p-4"></td>
            {tiers.map((tier) => (
              <td key={tier.id} className="p-4 text-center">
                <button
                  onClick={() => setSelectedTier(tier.id)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tier.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

