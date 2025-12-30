'use client'

import Link from 'next/link'

export default function TermsOfServicePage() {
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
              href="/register" 
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: '#53328A' }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#53328A' }}>
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> December 30, 2025
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using PayAid V3 ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                2. Description of Service
              </h2>
              <p className="text-gray-700 leading-relaxed">
                PayAid V3 is a comprehensive business management platform that provides CRM, invoicing, inventory management, HR, accounting, and AI-powered automation tools for businesses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                3. User Accounts
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>You are responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                5. Payment Terms
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Failure to pay may result in suspension or termination of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                6. Intellectual Property
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The Service and its original content, features, and functionality are owned by PayAid and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                7. User Content
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You retain ownership of content you upload to the Service. By uploading content, you grant us a license to use, store, and process that content to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                8. Service Availability
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                9. Limitation of Liability
              </h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, PayAid shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                10. Termination
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                11. Governing Law
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                12. Contact Information
              </h2>
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

