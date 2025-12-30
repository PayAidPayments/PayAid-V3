'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    type: 'customer',
    firstName: '',
    lastName: '',
    companyName: '',
    dsaName: '',
    phone: '',
    email: '',
    website: '',
    date: '',
    time: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert('Thank you for your message! We will get back to you soon.')
  }

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
              We're here to Help you.
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Can't find the answers you're looking for? Drop us a message and we'll get back to you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#53328A' }}>
              Drop us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hi, I am a *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="existing-merchant">Existing merchant</option>
                  <option value="existing-partner">Existing partner/DSA</option>
                  <option value="prospective-client">Prospective client</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {formData.type === 'existing-partner' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name of DSA *
                  </label>
                  <input
                    type="text"
                    value={formData.dsaName}
                    onChange={(e) => setFormData({ ...formData, dsaName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website / URL *
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When can we connect - Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-3 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: '#53328A' }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Office Locations Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#53328A' }}>
            Direct support? Please visit our office
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#53328A' }}>
                Registered Office
              </h3>
              <p className="text-gray-700 leading-relaxed">
                4th Floor, 6-3-1097 and 1098, Flat 4E / 405, Garden Manor,<br />
                Ayyappaswamy Temple Lane, Somajiguda,<br />
                Hyderabad, Telangana - 500082
              </p>
            </div>
            <div className="bg-white rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#53328A' }}>
                Sales Office
              </h3>
              <p className="text-gray-700 leading-relaxed">
                PayAid Payments Private Limited,<br />
                Plot No 4/2, Sector 1, Second Floor, RAM SVR, Madhapur,<br />
                HUDA Techno Enclave, HITEC City,<br />
                Hyderabad, Telangana, 500081<br />
                Opp to Hegde Fertility Center - Hitech City.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#53328A' }}>
                E-mail
              </h3>
              <a href="mailto:helpdesk@payaidpayments.com" className="text-gray-700 hover:text-purple-600">
                helpdesk@payaidpayments.com
              </a>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#53328A' }}>
                Call Us
              </h3>
              <a href="tel:+918008639080" className="text-gray-700 hover:text-purple-600">
                +91 800 863 9080
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: '#53328A' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#53328A' }}>
                What are the basic requirements to apply for Payment Gateway?
              </h3>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Business proof (Certificate of Incorporation, Partnership deed, GST certificate).</li>
                <li>Business PAN Card.</li>
                <li>Promoter (Director/Proprietor/Partners) PAN Card.</li>
                <li>Bank Account details (Cancelled Cheque).</li>
                <li>Authorized Signatories Address proof (Aadhar/DL/EC/Passport/Any Govt proof with Address).</li>
              </ol>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#53328A' }}>
                Does our site need to be PCI Compliant to use accept payments?
              </h3>
              <p className="text-gray-700">
                Nope! Since the consumers payment info is passed directly to us over SSL and never touches your server, PCI compliance is not required. You merely work with the token we supply.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#53328A' }}>
                Can we save consumer payment information?
              </h3>
              <p className="text-gray-700">
                Not the actual payment info, but you can store the token and call it again later. Since the consumers payment info is passed directly to us over SSL and never touches your server you never get it to save.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#53328A' }}>
                Can you help us with the coding?
              </h3>
              <p className="text-gray-700">
                Maybe, though it is not considered part of the normal boarding process. We are happy to answer questions and provide sample code, however if you require extensive coding, we would need to discuss your needs. Our development team would review your request and provide a cost estimate for you. Please contact us at helpdesk@payaidpayments.com
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#53328A' }}>
                Is there a way to accept payments with you without using the API?
              </h3>
              <p className="text-gray-700">
                Yes, you can use our Payment Dashboard to send out payment links or use our Hosted Payment Page and the pre-built code for it, so you won't even realize your using the API. You see, everything goes thru the API, but we make it easier for merchants who do not need a complex integration. Also you can sign up for our Invoicing Service to send invoices with online payment options.
              </p>
            </div>
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

