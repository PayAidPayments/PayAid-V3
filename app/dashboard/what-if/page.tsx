'use client'

import { WhatIfAnalysis } from '@/components/WhatIfAnalysis'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function WhatIfPage() {
  return (
    <div className="flex flex-col h-full">
      <ModuleTopBar title="What-If Analysis" module="ai-studio" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WhatIfAnalysis />
        </div>
      </main>
    </div>
  )
}
