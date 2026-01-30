'use client'

/**
 * Universal Module Template
 * 
 * This template serves as a reference for creating new modules or updating existing ones
 * to follow the Universal Design System standards.
 * 
 * Copy this template and customize for your specific module.
 */

import { UniversalModuleLayout } from './UniversalModuleLayout'
import { UniversalModuleHero } from './UniversalModuleHero'
import { GlassCard } from './GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface ModuleTemplateProps {
  tenantId: string
  // Add module-specific props here
}

export default function ModuleTemplatePage({ tenantId }: ModuleTemplateProps) {
  // Get module configuration
  const moduleConfig = getModuleConfig('crm') // Replace with your module ID
  
  // Fetch module-specific data
  // const [data, setData] = useState(null)
  // useEffect(() => { ... }, [tenantId])

  // Define top bar navigation items
  const topBarItems = [
    { name: 'Home', href: `/${moduleConfig.id}/${tenantId}/Home` },
    { name: 'Item 1', href: `/${moduleConfig.id}/${tenantId}/Item1` },
    { name: 'Item 2', href: `/${moduleConfig.id}/${tenantId}/Item2` },
    // Add more items...
  ]

  // Define hero metrics (4 cards)
  const heroMetrics = [
    {
      label: 'Metric 1',
      value: '100', // Use formatINRForDisplay() for currency
      change: 15,
      trend: 'up' as const,
      color: 'purple' as const,
    },
    {
      label: 'Metric 2',
      value: formatINRForDisplay(450000), // Currency example
      change: 12,
      trend: 'up' as const,
      color: 'gold' as const,
    },
    {
      label: 'Metric 3',
      value: '50',
      change: -5,
      trend: 'down' as const,
      color: 'info' as const,
    },
    {
      label: 'Metric 4',
      value: '25',
      change: 8,
      trend: 'up' as const,
      color: 'success' as const,
    },
  ]

  return (
    <UniversalModuleLayout
      moduleId={moduleConfig.id}
      moduleName={moduleConfig.name}
      topBarItems={topBarItems}
    >
      {/* Hero Section - Standardized */}
      <UniversalModuleHero
        moduleName={moduleConfig.name}
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
        subtitle={moduleConfig.description}
      />

      {/* Content Sections - 32px gap between sections */}
      <div className="p-6 space-y-8">
        {/* Section 1 */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Section Title</h2>
          <p className="text-gray-600">Content goes here...</p>
        </GlassCard>

        {/* Section 2 */}
        <GlassCard delay={0.1}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Another Section</h2>
          <p className="text-gray-600">More content...</p>
        </GlassCard>

        {/* Add more sections as needed */}
      </div>
    </UniversalModuleLayout>
  )
}

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Copy this file to your module directory
 * 2. Replace 'crm' with your module ID in getModuleConfig()
 * 3. Update topBarItems with your module's navigation
 * 4. Update heroMetrics with your module's key metrics
 * 5. Add your module-specific content sections using GlassCard
 * 6. Ensure all currency values use formatINRForDisplay()
 * 7. Follow the 32px gap spacing between sections
 * 8. Use module-specific gradient from module-config.ts
 */
