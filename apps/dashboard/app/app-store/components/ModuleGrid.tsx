'use client'

import { useState } from 'react'
import { ModuleDefinition } from '@prisma/client'
import ModuleCard from './ModuleCard'

interface ModuleGridProps {
  modules: ModuleDefinition[]
}

export default function ModuleGrid({ modules }: ModuleGridProps) {
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter modules based on category and search, excluding deprecated modules
  const deprecatedModules = ['invoicing', 'accounting']
  const filteredModules = modules
    .filter((module) => !deprecatedModules.includes(module.moduleId))
    .filter((module) => {
      const matchesFilter = filter === 'all' || module.moduleId === filter
      const matchesSearch = 
        module.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'crm', label: 'CRM' },
    { id: 'finance', label: 'Finance' },
    { id: 'hr', label: 'HR' },
    { id: 'communication', label: 'Communication' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <div>
      {/* Filter & Search */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Module Grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No modules found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

