'use client'

import { useState } from 'react'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'Can I try modules before purchasing?',
    answer: 'Yes! All modules come with a 14-day free trial. No credit card required.',
  },
  {
    question: 'Can I purchase individual modules?',
    answer: 'Absolutely! You can purchase modules individually or save with our bundles.',
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: 'We\'ll notify you before you reach your limits. You can upgrade your plan anytime.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. No long-term contracts.',
  },
  {
    question: 'Do you offer discounts for annual plans?',
    answer: 'Yes! Annual plans come with a 20% discount compared to monthly billing.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees. You only pay for the modules you choose.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
            >
              <span className="font-semibold text-gray-900">{faq.question}</span>
              <span className="text-gray-500 text-xl">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

