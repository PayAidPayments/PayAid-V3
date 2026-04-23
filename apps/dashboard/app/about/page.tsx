'use client'

import Link from 'next/link'

export default function AboutPage() {
  const highlights = [
    {
      title: 'Built for Indian businesses',
      text: 'GST-ready workflows, local payment context, and practical tools for day-to-day operations.',
    },
    {
      title: 'One platform, many modules',
      text: 'CRM, Finance, HR, Inventory, Marketing, and AI in one workspace with one login.',
    },
    {
      title: 'Fast onboarding',
      text: 'Choose your industry, pick modules, and start your trial in minutes.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: '#53328A' }}>
              <span>←</span>
              <span>PayAid V3</span>
            </Link>
            <Link 
              href="/?onboarding=true#industry-selector" 
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: '#53328A' }}
            >
              Choose Industry & Start
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#53328A' }}>
              About PayAid
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple business operating system for Indian SMBs.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#53328A' }}>
              Vision
            </h2>
            <p className="text-xl text-gray-700 text-center leading-relaxed">
              Help every Indian business grow with digital tools that are easy to use.
            </p>
            <div className="mt-8 text-center">
              <span className="text-2xl font-bold" style={{ color: '#F5C700' }}>#YourPaymentPartner</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#53328A' }}>
              Mission
            </h2>
            <p className="text-xl text-gray-700 text-center leading-relaxed">
              Bring payments, operations, and AI into one platform that saves time and cost.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#53328A' }}>
            Why businesses choose PayAid
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {highlights.map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3" style={{ color: '#53328A' }}>
                  {item.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r" style={{ background: 'linear-gradient(135deg, #53328A 0%, #6B4BA1 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Choose your industry, select modules, and start your free trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/?onboarding=true#industry-selector"
              className="px-8 py-3 rounded-lg font-medium text-purple-900 bg-yellow-400 hover:bg-yellow-300 transition-colors"
            >
              Choose Industry & Start
            </Link>
            <Link 
              href="/contact"
              className="px-8 py-3 rounded-lg font-medium text-white border-2 border-white hover:bg-white hover:text-purple-900 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 PayAid V3. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

