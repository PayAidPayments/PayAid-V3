import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { BASE_MODULES, INDUSTRY_PACKS, getRecommendedModules } from '@/lib/onboarding/industry-presets'

// GET /api/modules - Get all modules with recommendations
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get tenant onboarding data
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        onboardingData: true,
        onboardingCompleted: true,
      },
    })

    // Get active module licenses
    const licenses = await prisma.moduleLicense.findMany({
      where: { tenantId, isActive: true },
      select: { moduleId: true },
    })
    const activeModuleIds = new Set(licenses.map((l) => l.moduleId))

    // Get recommended modules based on onboarding
    let recommendedModuleIds: string[] = []
    if (tenant?.onboardingCompleted && tenant.onboardingData) {
      const onboardingData = tenant.onboardingData as any
      const recommendations = getRecommendedModules(
        onboardingData.industries || [],
        onboardingData.goals || [],
        onboardingData.businessComplexity || 'single'
      )
      recommendedModuleIds = [
        ...recommendations.baseModules,
        ...recommendations.industryPacks,
        ...recommendations.recommendedModules,
      ]
    }

    // Build module list
    const allModules: Array<{
      id: string
      name: string
      description: string
      icon: string
      category: 'base' | 'industry' | 'recommended'
      isActive: boolean
      isRecommended: boolean
    }> = []

    // Base modules
    BASE_MODULES.forEach((moduleId) => {
      allModules.push({
        id: moduleId,
        name: formatModuleName(moduleId),
        description: getModuleDescription(moduleId),
        icon: getModuleIcon(moduleId),
        category: 'base',
        isActive: activeModuleIds.has(moduleId) || true, // Base modules are always active
        isRecommended: recommendedModuleIds.includes(moduleId),
      })
    })

    // Industry packs
    INDUSTRY_PACKS.forEach((moduleId) => {
      allModules.push({
        id: moduleId,
        name: formatModuleName(moduleId),
        description: getModuleDescription(moduleId),
        icon: getModuleIcon(moduleId),
        category: 'industry',
        isActive: activeModuleIds.has(moduleId),
        isRecommended: recommendedModuleIds.includes(moduleId),
      })
    })

    // Separate by category
    const base = allModules.filter((m) => m.category === 'base')
    const industry = allModules.filter((m) => m.category === 'industry')
    const recommended = allModules.filter((m) => m.isRecommended)

    return NextResponse.json({
      recommended,
      all: allModules,
      base,
      industry,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get modules error:', error)
    return NextResponse.json(
      { error: 'Failed to get modules', recommended: [], all: [], base: [], industry: [] },
      { status: 500 }
    )
  }
}

function formatModuleName(moduleId: string): string {
  return moduleId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getModuleDescription(moduleId: string): string {
  const descriptions: Record<string, string> = {
    crm: 'Manage contacts, leads, and customer relationships',
    sales: 'Track sales, deals, and revenue',
    marketing: 'Run campaigns, email marketing, and social media',
    finance: 'Accounting, invoicing, and financial management',
    hr: 'Employee management, payroll, and HR operations',
    communication: 'Email, SMS, WhatsApp, and team communication',
    'ai-studio': 'AI-powered automation and insights',
    analytics: 'Business intelligence and reporting',
    invoicing: 'Create and manage invoices',
    accounting: 'Full accounting and bookkeeping',
    inventory: 'Stock management and tracking',
    productivity: 'Docs, spreadsheets, presentations, and collaboration',
    restaurant: 'Restaurant operations, orders, and table management',
    retail: 'Retail POS, inventory, and sales',
    manufacturing: 'Production, scheduling, and quality control',
    'service-businesses': 'Projects, time tracking, and client management',
    ecommerce: 'Online store and marketplace integration',
    healthcare: 'Patient management and appointments',
    education: 'Student management and attendance',
    'real-estate': 'Property and tenant management',
    logistics: 'Shipping and fleet management',
    construction: 'Project and material management',
    beauty: 'Salon and appointment management',
    automotive: 'Service and parts management',
    hospitality: 'Hotel and booking management',
    legal: 'Case and client management',
    financial: 'Client and compliance management',
    event: 'Event planning and management',
    wholesale: 'B2B distribution and management',
    agriculture: 'Crop and supply chain management',
  }
  return descriptions[moduleId] || `${formatModuleName(moduleId)} module`
}

function getModuleIcon(moduleId: string): string {
  const icons: Record<string, string> = {
    crm: '👥',
    sales: '💼',
    marketing: '📢',
    finance: '💰',
    hr: '👔',
    communication: '💬',
    'ai-studio': '🤖',
    analytics: '📊',
    invoicing: '🧾',
    accounting: '📈',
    inventory: '📦',
    productivity: '📝',
    restaurant: '🍽️',
    retail: '🏪',
    manufacturing: '🏭',
    'service-businesses': '🔧',
    ecommerce: '🛒',
    healthcare: '🏥',
    education: '🎓',
    'real-estate': '🏠',
    logistics: '🚚',
    construction: '🏗️',
    beauty: '💅',
    automotive: '🚗',
    hospitality: '🏨',
    legal: '⚖️',
    financial: '💳',
    event: '🎉',
    wholesale: '📦',
    agriculture: '🌾',
  }
  return icons[moduleId] || '📦'
}
