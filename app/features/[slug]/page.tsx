'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFeatureBySlug, features } from '@/lib/data/features'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function FeaturePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const feature = getFeatureBySlug(slug)

  if (!feature) {
    notFound()
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
            <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={{ 
                backgroundColor: feature.category === 'ai-service' ? '#E9D5FF' : 
                                feature.category === 'module' ? '#DBEAFE' : '#D1FAE5',
                color: feature.category === 'ai-service' ? '#6B21A8' : 
                       feature.category === 'module' ? '#1E40AF' : '#065F46'
              }}
            >
              {feature.category === 'ai-service' ? 'AI Service' : 
               feature.category === 'module' ? 'Business Module' : 'Industry Solution'}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#53328A' }}>
              {feature.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {feature.longDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#53328A' }}>
            Key Benefits
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feature.benefits.map((benefit, index) => (
              <div key={index} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#53328A' }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-gray-700 font-medium">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#53328A' }}>
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {feature.keyFeatures.map((keyFeature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg">
                <svg className="w-6 h-6 flex-shrink-0" style={{ color: '#F5C700' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{keyFeature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#53328A' }}>
            Use Cases
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feature.useCases.map((useCase, index) => (
              <div key={index} className="p-6 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <p className="text-gray-700">{useCase}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      {feature.caseStudies && feature.caseStudies.length > 0 ? (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#53328A' }}>
              Success Stories
            </h2>
            <div className="space-y-8">
              {feature.caseStudies.map((caseStudy, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 border-l-4" style={{ borderLeftColor: '#53328A' }}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#53328A' }}>
                      {caseStudy.company}
                    </h3>
                    <p className="text-gray-600 font-medium">{caseStudy.industry}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2">Challenge:</h4>
                    <p className="text-gray-700">{caseStudy.challenge}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2">Solution:</h4>
                    <p className="text-gray-700">{caseStudy.solution}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2">Results:</h4>
                    <ul className="space-y-2">
                      {caseStudy.results.map((result, resultIndex) => (
                        <li key={resultIndex} className="flex items-start gap-2">
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F5C700' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {caseStudy.quote && (
                    <div className="mt-6 p-4 rounded-lg bg-purple-50 border-l-4" style={{ borderLeftColor: '#F5C700' }}>
                      <p className="text-gray-800 italic">&quot;{caseStudy.quote}&quot;</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r" style={{ background: 'linear-gradient(135deg, #53328A 0%, #6B4BA1 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start your free trial today and experience the power of {feature.title}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="px-8 py-3 rounded-lg font-medium text-purple-900 bg-yellow-400 hover:bg-yellow-300 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/#pricing"
              className="px-8 py-3 rounded-lg font-medium text-white border-2 border-white hover:bg-white hover:text-purple-900 transition-colors"
            >
              View Pricing
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
              <Link href="/#features" className="text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

