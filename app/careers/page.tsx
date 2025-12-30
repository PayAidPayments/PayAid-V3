'use client'

import Link from 'next/link'

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: '#53328A' }}>
              <span>←</span>
              <span>PayAid V3</span>
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: '#53328A' }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Coming Soon Section */}
      <div className="text-center max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
        <div className="mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#53328A' }}>
            Careers at PayAid
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Coming Soon
          </p>
          <p className="text-lg text-gray-600 mb-8">
            We're building an amazing team to transform how Indian businesses operate. 
            Check back soon for exciting career opportunities!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="px-8 py-3 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: '#53328A' }}
          >
            Back to Home
          </Link>
          <Link 
            href="/contact"
            className="px-8 py-3 rounded-lg font-medium border-2 transition-colors"
            style={{ borderColor: '#53328A', color: '#53328A' }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

