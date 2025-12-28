import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import ModuleGrid from './components/ModuleGrid'
import BundleSection from './components/BundleSection'
import ComparisonTable from './components/ComparisonTable'
import HeroSection from './components/HeroSection'
import FAQSection from './components/FAQSection'

export const metadata = {
  title: 'App Store - PayAid',
  description: 'Browse and purchase PayAid modules',
}

// Force dynamic rendering to avoid database queries during build
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getModules() {
  try {
    const modules = await prisma.moduleDefinition.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
    })
    return modules
  } catch (error) {
    console.error('Error fetching modules:', error)
    // Return empty array if database is not available (e.g., during build)
    return []
  }
}

async function getBundles() {
  // Define bundles programmatically
  const bundles = [
    {
      id: 'starter',
      name: 'Starter Bundle',
      description: 'Perfect for small businesses getting started',
      modules: ['crm', 'invoicing'],
      individualPrice: 0,
      bundlePrice: 0,
      savings: 0,
      mostPopular: false,
    },
    {
      id: 'professional',
      name: 'Professional Bundle',
      description: 'Complete solution for growing businesses',
      modules: ['crm', 'invoicing', 'accounting', 'hr', 'whatsapp', 'analytics'],
      individualPrice: 0,
      bundlePrice: 0,
      savings: 0,
      mostPopular: true,
    },
    {
      id: 'complete',
      name: 'Complete Suite',
      description: 'Everything you need for enterprise operations',
      modules: ['crm', 'invoicing', 'accounting', 'hr', 'whatsapp', 'analytics'],
      individualPrice: 0,
      bundlePrice: 0,
      savings: 0,
      mostPopular: false,
    },
  ]
  return bundles
}

export default async function AppStorePage() {
  // Check authentication (optional - can be public)
  // const auth = await requireAuth()
  // if (!auth) {
  //   redirect('/login?redirect=/app-store')
  // }

  const modules = await getModules()
  const bundles = await getBundles()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Module Grid */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Your Modules
            </h2>
            <p className="text-lg text-gray-600">
              Select the modules that fit your business needs
            </p>
          </div>
          <Suspense fallback={<div>Loading modules...</div>}>
            <ModuleGrid modules={modules} />
          </Suspense>
        </section>

        {/* Bundle Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Save with Bundles
            </h2>
            <p className="text-lg text-gray-600">
              Get more value with our curated bundles
            </p>
          </div>
          <Suspense fallback={<div>Loading bundles...</div>}>
            <BundleSection bundles={bundles} />
          </Suspense>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Compare Plans
            </h2>
            <p className="text-lg text-gray-600">
              Find the perfect plan for your business
            </p>
          </div>
          <Suspense fallback={<div>Loading comparison...</div>}>
            <ComparisonTable />
          </Suspense>
        </section>

        {/* FAQ Section */}
        <section>
          <FAQSection />
        </section>
      </div>
    </div>
  )
}

