'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#53328A' }}>
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> December 30, 2025
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                PayAid V3 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                2.1 Information You Provide
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Account information (name, email, phone number)</li>
                <li>Business information (company name, GST number, address)</li>
                <li>Payment information (processed securely through payment gateways)</li>
                <li>Content you create or upload to our platform</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                2.2 Automatically Collected Information
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Device information and IP address</li>
                <li>Browser type and version</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>To provide and maintain our services</li>
                <li>To process transactions and payments</li>
                <li>To send you updates, newsletters, and marketing communications (with your consent)</li>
                <li>To improve our platform and develop new features</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                4. Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>128-bit SSL encryption for data transmission</li>
                <li>Secure data centers with physical and digital safeguards</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Data backup and disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or legal process</li>
                <li>To protect our rights and the safety of our users</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                6. Your Rights
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                7. Cookies and Tracking
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze usage, and assist in marketing efforts. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                8. Data Retention
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                9. Children's Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                10. Changes to This Policy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                11. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> helpdesk@payaidpayments.com<br />
                  <strong>Phone:</strong> +91 800 863 9080<br />
                  <strong>Address:</strong> Plot No 4/2, Sector 1, Second Floor, RAM SVR, Madhapur, HUDA Techno Enclave, Hitech City, Hyderabad, Telangana – 500081
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 PayAid V3. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
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

