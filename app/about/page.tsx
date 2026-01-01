'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#53328A' }}>
              About PayAid V3
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empowering Indian businesses with AI-powered tools and integrated solutions
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#53328A' }}>
              Vision
            </h2>
            <p className="text-xl text-gray-700 text-center leading-relaxed">
              To empower all Indian businesses with the tools and resources necessary to fully adopt digital payments and AI-powered business management.
            </p>
            <div className="mt-8 text-center">
              <span className="text-2xl font-bold" style={{ color: '#F5C700' }}>#YourPaymentPartner</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#53328A' }}>
              Mission
            </h2>
            <p className="text-xl text-gray-700 text-center leading-relaxed">
              To Provide the Best Integrated Digitisation & Payments Platform for Businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#53328A' }}>
            Leadership
          </h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Alka Mehta */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#53328A' }}>
                Alka Mehta
              </h3>
              <p className="text-lg font-semibold mb-4" style={{ color: '#F5C700' }}>
                Founder and CEO
              </p>
              <p className="text-gray-700 leading-relaxed">
                Alka Mehta, our Founder and CEO, comes with over 31 years of experience in sales and customer service. Alka has worked in the banking industry with the largest Private Sector bank in India, having handled multiple roles in the Payment Business. Her expertise lies in Merchant Acquiring, Payment Solutions, relationship handling, strategic sales planning, driving sales teams and servicing client&apos;s requirements to ensure client satisfaction.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Alka is known in the Merchant Acquiring industry as a person with excellent relationship skills and the onus to customize and deliver products to suit Customers&apos; requirements, while prioritizing and ensuring the long-term sustainability and profitability of the business over short-term &quot;quick fixes&quot;, much as any business owner-manager would.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Alka brings to the table, her expertise on Payment Solutions in B2B and B2C segments on both issuance and acquiring.
              </p>
            </div>

            {/* Phani Teja */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#53328A' }}>
                Phani Teja
              </h3>
              <p className="text-lg font-semibold mb-4" style={{ color: '#F5C700' }}>
                Co-founder & Managing Director
              </p>
              <p className="text-gray-700 leading-relaxed">
                Phani Teja, our Co-founder and Managing Director, holds a Masters degree in Business Administration and is a sales and marketing professional with around 12 years of progressive experience, encompassing various facets of Financial Services i.e., Business Development, Operations of Businesses in large corporates, Key Account management, and customer acquisition.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                He has a profound working knowledge in designing and deploying sales and marketing strategies, programs and contents to improve sales opportunities. His last assignment was with HDFC Bank as a Strategic National Accounts Manager, handling large accounts and maintaining profitability of the merchants and the bank.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                With his exceptional relationship skills, he has developed an extensive amount of network contacts in the Merchant Industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#53328A' }}>
            Core Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold mb-2" style={{ color: '#53328A' }}>
                Ragam Shashikanth
              </h3>
              <p className="text-gray-600 mb-4">Operations Manager</p>
              <p className="text-sm text-gray-600">
                Total Experience: 14 years<br />
                Previous roles at HDFC Bank Ltd., Axis Bank Ltd., Payswiff Solutions Pvt Ltd., and Pine labs Pvt Ltd.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold mb-2" style={{ color: '#53328A' }}>
                KR Sundeep
              </h3>
              <p className="text-gray-600 mb-4">Ops & Tech Support</p>
              <p className="text-sm text-gray-600">
                Total Experience: 4 years<br />
                Previous role at HDFC Bank Ltd.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold mb-2" style={{ color: '#53328A' }}>
                Venkatesh Goud
              </h3>
              <p className="text-gray-600 mb-4">State Head - South</p>
              <p className="text-sm text-gray-600">
                Total Experience: 14 years<br />
                Previous roles at Axis Bank Ltd. and Bijli Pay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#53328A' }}>
            Achievements
          </h2>
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl p-8 border-2" style={{ borderColor: '#F5C700' }}>
            <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#53328A' }}>
              The Best Payments Startup Of the Year 2021 – PayAid Payments
            </h3>
            <p className="text-gray-700 text-center leading-relaxed">
              It gives us immense pleasure to share that PayAid Payments has won the award for the Best Payments Startup of the year 2021 at the 9th Payments Industry Awards.
            </p>
            <p className="text-gray-700 text-center leading-relaxed mt-4">
              For us at PayAid Payments to have received such a prestigious award in our short journey of 8 months is both exciting and humbling.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r" style={{ background: 'linear-gradient(135deg, #53328A 0%, #6B4BA1 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join Us on Our Journey
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Be part of the digital transformation of Indian businesses
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="px-8 py-3 rounded-lg font-medium text-purple-900 bg-yellow-400 hover:bg-yellow-300 transition-colors"
            >
              Start Free Trial
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

      {/* Footer */}
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

