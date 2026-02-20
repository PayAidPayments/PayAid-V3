'use client'

import { WhatIfAnalysis } from '@/components/WhatIfAnalysis'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function WhatIfPage() {
  return (
    <div className="flex flex-col h-full">
      <ModuleTopBar 
        moduleId="ai-studio" 
        moduleName="What-If Analysis" 
        items={[]} 
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WhatIfAnalysis />
        </div>
      </main>
    </div>
  )
}
