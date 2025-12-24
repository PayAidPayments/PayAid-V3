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
  { name: 'Invoicing Module', starter: true, professional: true, complete: true, enterprise: true },
  { name: 'Accounting Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'HR Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'WhatsApp Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'Analytics Module', starter: false, professional: true, complete: true, enterprise: true },
  { name: 'Max Contacts', starter: '500', professional: '5,000', complete: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Max Users', starter: '3', professional: '10', complete: '50', enterprise: 'Unlimited' },
  { name: 'Storage', starter: '5 GB', professional: '50 GB', complete: '500 GB', enterprise: 'Unlimited' },
  { name: 'Support', starter: 'Email', professional: 'Email + Chat', complete: 'Priority', enterprise: 'Dedicated' },
]

const tiers = [
  { id: 'starter', name: 'Starter', price: '₹2,999', popular: false },
  { id: 'professional', name: 'Professional', price: '₹9,999', popular: true },
  { id: 'complete', name: 'Complete', price: '₹19,999', popular: false },
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

