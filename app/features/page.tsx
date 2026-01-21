'use client'

import Link from 'next/link'
import { modules } from '@/lib/modules.config'
import { MODULE_PRICING } from '@/lib/pricing/config'
import { useState } from 'react'

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional'>('starter')

  // Filter out industry modules (they're not modules, they're industry packages)
  const industryIds = ['restaurant', 'retail', 'service', 'ecommerce', 'manufacturing', 'field-service', 'asset-management', 'professional-services', 'healthcare']
  const availableModules = modules.filter(m => !industryIds.includes(m.id))

  const categories = ['all', 'core', 'productivity', 'ai']
  const filteredModules = selectedCategory === 'all' 
    ? availableModules 
    : availableModules.filter(m => m.category === selectedCategory)

  const getModulePrice = (moduleId: string) => {
    const pricing = MODULE_PRICING[moduleId]
    if (!pricing) return 0
    return selectedTier === 'starter' ? pricing.starter : pricing.professional
  }

  const freeModules = filteredModules.filter(m => getModulePrice(m.id) === 0)
  const paidModules = filteredModules.filter(m => getModulePrice(m.id) > 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-[#53328A]">Pay</span>
              <span className="text-[#F5C700]">Aid</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-gray-700 hover:text-[#53328A]">Home</Link>
              <Link href="/features" className="text-[#53328A] font-semibold">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-[#53328A]">Pricing</Link>
              <Link href="/app-store" className="text-gray-700 hover:text-[#53328A]">App Store</Link>
            </nav>
            <Link href="/signup" className="bg-[#53328A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#6B42A3] transition">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          <span className="bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent">
            29+ Powerful Modules
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Everything you need to run your business. Pay only for what you use. Start with one module, add more as you grow.
        </p>

        {/* Tier Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-medium ${selectedTier === 'starter' ? 'text-[#53328A]' : 'text-gray-500'}`}>
            Starter
          </span>
          <button
            onClick={() => setSelectedTier(selectedTier === 'starter' ? 'professional' : 'starter')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              selectedTier === 'professional' ? 'bg-[#53328A]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                selectedTier === 'professional' ? 'translate-x-7' : ''
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${selectedTier === 'professional' ? 'text-[#53328A]' : 'text-gray-500'}`}>
            Professional
          </span>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? 'bg-[#53328A] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#53328A]'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Free Modules Section */}
      {freeModules.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Free Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeModules.map((module) => (
              <div key={module.id} className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{module.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                    FREE
                  </span>
                </div>
                <Link
                  href="/app-store"
                  className="text-[#53328A] font-semibold hover:underline text-sm"
                >
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paid Modules Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Paid Modules - {selectedTier === 'starter' ? '₹1,999' : '₹3,999'}/module/month
        </h2>
        <p className="text-gray-600 mb-6">
          Annual billing saves you 20%. All modules billed annually.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paidModules.map((module) => {
            const price = getModulePrice(module.id)
            const annualPrice = Math.round(price * 12 * 0.8)
            const monthlyEquivalent = Math.round(price * 0.8)
            
            return (
              <div key={module.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#53328A] transition shadow-md hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{module.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm text-gray-500 line-through">₹{price.toLocaleString()}/mo</span>
                    <span className="text-2xl font-bold text-[#53328A]">₹{monthlyEquivalent.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    ₹{annualPrice.toLocaleString()}/year (billed annually)
                  </div>
                  <Link
                    href="/app-store"
                    className="block w-full text-center bg-[#53328A] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#6B42A3] transition"
                  >
                    Add Module
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#53328A] to-[#6B42A3] text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start with one module and add more as your business grows. All modules include a 1-month free trial.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/app-store"
              className="bg-[#F5C700] text-gray-900 px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5B700] transition"
            >
              Browse Modules
            </Link>
            <Link
              href="/signup"
              className="bg-white text-[#53328A] px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-[#F5C700] transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-[#F5C700] transition-colors">Pricing</Link></li>
                <li><Link href="/app-store" className="hover:text-[#F5C700] transition-colors">Integrations</Link></li>
                <li><Link href="/security" className="hover:text-[#F5C700] transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/industries/restaurant" className="hover:text-[#F5C700] transition-colors">Restaurants</Link></li>
                <li><Link href="/industries/retail" className="hover:text-[#F5C700] transition-colors">Retail</Link></li>
                <li><Link href="/industries/services" className="hover:text-[#F5C700] transition-colors">Services</Link></li>
                <li><Link href="/industries/ecommerce" className="hover:text-[#F5C700] transition-colors">E-Commerce</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-[#F5C700] transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-[#F5C700] transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-[#F5C700] transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-[#F5C700] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#F5C700] mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy-policy" className="hover:text-[#F5C700] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-[#F5C700] transition-colors">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-[#F5C700] transition-colors">Compliance</Link></li>
                <li><Link href="/security" className="hover:text-[#F5C700] transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 PayAid. Built for Indian Businesses. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
