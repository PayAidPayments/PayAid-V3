'use client'

import Link from 'next/link'

export default function SecurityPage() {
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
            Security
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your data security is our top priority. We implement industry-leading security measures to protect your business information.
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                1. Data Encryption
              </h2>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                1.1 Encryption in Transit
              </h3>
              <p className="text-gray-700 leading-relaxed">
                All data transmitted between your device and our servers is encrypted using 128-bit SSL/TLS encryption—the same security standard trusted by leading banks worldwide.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                1.2 Encryption at Rest
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Sensitive data stored in our databases is encrypted using industry-standard encryption algorithms to protect against unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                2. Infrastructure Security
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Secure data centers with 24/7 physical security</li>
                <li>Redundant systems and backup infrastructure</li>
                <li>DDoS protection and mitigation</li>
                <li>Firewall protection and intrusion detection</li>
                <li>Regular security updates and patches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                3. Access Control
              </h2>
              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                3.1 Authentication
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Strong password requirements</li>
                <li>Multi-factor authentication (MFA) support</li>
                <li>Session management and timeout</li>
                <li>Secure password hashing</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#53328A' }}>
                3.2 Authorization
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Role-based access control (RBAC)</li>
                <li>Granular permissions management</li>
                <li>Audit logs for all access</li>
                <li>Regular access reviews</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                4. Payment Security
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>PCI DSS compliant payment processing</li>
                <li>Tokenization for payment data</li>
                <li>Secure payment gateway integration</li>
                <li>Fraud detection and prevention</li>
                <li>No storage of sensitive payment card data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                5. Data Backup and Recovery
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Automated daily backups</li>
                <li>Multiple backup locations</li>
                <li>Point-in-time recovery capabilities</li>
                <li>Regular backup testing</li>
                <li>Disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                6. Security Monitoring
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>24/7 security monitoring</li>
                <li>Real-time threat detection</li>
                <li>Automated alerting for suspicious activities</li>
                <li>Security incident response team</li>
                <li>Regular security audits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                7. Compliance and Certifications
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>ISO 27001 security practices</li>
                <li>GDPR-compliant data handling</li>
                <li>Information Technology Act, 2000 compliance</li>
                <li>Regular third-party security assessments</li>
                <li>Vulnerability disclosure program</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                8. Employee Security
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Background checks for all employees</li>
                <li>Security training and awareness programs</li>
                <li>Strict access controls for internal systems</li>
                <li>Confidentiality agreements</li>
                <li>Regular security training updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                9. Incident Response
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We have a comprehensive incident response plan that includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>Immediate threat containment</li>
                <li>Investigation and analysis</li>
                <li>Notification procedures</li>
                <li>Recovery and restoration</li>
                <li>Post-incident review and improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                10. Your Role in Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Security is a shared responsibility. We recommend:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Using strong, unique passwords</li>
                <li>Enabling multi-factor authentication</li>
                <li>Regularly reviewing access permissions</li>
                <li>Keeping your devices and browsers updated</li>
                <li>Reporting suspicious activities immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                11. Security Updates
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We continuously improve our security measures and will notify users of any significant security updates or changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
                12. Report Security Issues
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you discover a security vulnerability, please report it to us immediately:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> security@payaidpayments.com<br />
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

