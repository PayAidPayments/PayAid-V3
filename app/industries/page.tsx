'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllIndustries } from '@/lib/industries/config'
import { Search } from 'lucide-react'

export default function IndustriesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const industries = getAllIndustries()

  const filteredIndustries = industries.filter(industry =>
    industry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    industry.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Industry
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            PayAid is tailored for your specific business needs. Select your industry to see customized features and modules.
          </p>
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search industries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIndustries.map((industry) => (
            <Card
              key={industry.id}
              className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => router.push(`/industries/${industry.id}`)}
            >
              <CardHeader>
                <div className="text-4xl mb-2">{industry.icon}</div>
                <CardTitle className="text-xl">{industry.name}</CardTitle>
                <CardDescription>{industry.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Core Modules:</p>
                  <div className="flex flex-wrap gap-2">
                    {industry.coreModules.slice(0, 3).map((module) => (
                      <span
                        key={module}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {module}
                      </span>
                    ))}
                    {industry.coreModules.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{industry.coreModules.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/industries/${industry.id}`)
                  }}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIndustries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No industries found matching your search.</p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

