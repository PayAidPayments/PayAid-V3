'use client'

import Link from 'next/link'

export default function CompliancePage() {
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
            Compliance & Regulatory Information
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> December 30, 2025
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                1. GST Compliance
              </h2>
              <p className="text-gray-700 leading-relaxed">
                PayAid V3 is designed to help Indian businesses maintain GST compliance:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>GST-compliant invoicing with automatic tax calculations</li>
                <li>Automated GSTR-1 and GSTR-3B report generation</li>
                <li>Real-time GST liability tracking</li>
                <li>Input tax credit management</li>
                <li>Compliance with all GST rules and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                2. Data Protection Compliance
              </h2>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                2.1 Information Technology Act, 2000
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We comply with the Information Technology Act, 2000 and related rules, including data protection and privacy requirements.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                2.2 Data Localization
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We store and process data in compliance with Indian data localization requirements where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                3. Payment Compliance
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>PCI DSS compliance for payment processing</li>
                <li>RBI guidelines compliance for payment aggregators</li>
                <li>Secure payment gateway integration</li>
                <li>Transaction monitoring and fraud prevention</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                4. Financial Compliance
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Accounting standards compliance (Ind AS where applicable)</li>
                <li>Audit trail maintenance</li>
                <li>Financial reporting capabilities</li>
                <li>Tax compliance features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                5. Labor Law Compliance
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Our HR module helps businesses comply with Indian labor laws:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>PF (Provident Fund) compliance</li>
                <li>ESI (Employee State Insurance) compliance</li>
                <li>Professional Tax compliance</li>
                <li>TDS (Tax Deducted at Source) compliance</li>
                <li>Labor law reporting and documentation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                6. Industry-Specific Compliance
              </h2>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                6.1 Restaurant & Food Services
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>FSSAI compliance tracking</li>
                <li>Food safety documentation</li>
                <li>License management</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                6.2 Healthcare
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>HIPAA-like data protection measures</li>
                <li>Patient data privacy</li>
                <li>Medical record management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                7. Security Standards
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>ISO 27001 security practices</li>
                <li>128-bit SSL encryption</li>
                <li>Regular security audits</li>
                <li>Vulnerability assessments</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                8. Audit and Reporting
              </h2>
              <p className="text-gray-700 leading-relaxed">
                PayAid V3 maintains comprehensive audit trails and provides reporting capabilities to help businesses:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>Maintain detailed transaction logs</li>
                <li>Generate compliance reports</li>
                <li>Track user activities</li>
                <li>Prepare for audits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                9. Updates and Changes
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We continuously update our platform to comply with changing regulations. We notify users of significant compliance-related changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                10. Contact for Compliance Inquiries
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

