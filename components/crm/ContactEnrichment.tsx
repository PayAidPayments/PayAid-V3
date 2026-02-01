'use client'

import { useState } from 'react'
import { Sparkles, Linkedin, Globe, Mail, Phone, MapPin, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EnrichmentData {
  socialProfiles?: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  companyInfo?: {
    website?: string
    industry?: string
    employees?: number
    revenue?: string
    headquarters?: string
  }
  verified?: {
    email?: boolean
    phone?: boolean
    company?: boolean
  }
}

interface ContactEnrichmentProps {
  contactId: string
  tenantId: string
  currentData?: {
    email?: string
    phone?: string
    company?: string
  }
  onEnrich: (data: EnrichmentData) => Promise<void>
}

export function ContactEnrichment({ contactId, tenantId, currentData, onEnrich }: ContactEnrichmentProps) {
  const [enriching, setEnriching] = useState(false)
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null)

  const handleEnrich = async () => {
    setEnriching(true)
    try {
      // Call enrichment API
      const response = await fetch(`/api/crm/contacts/${contactId}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      setEnrichmentData(data)
      await onEnrich(data)
    } catch (error) {
      console.error('Enrichment error:', error)
    } finally {
      setEnriching(false)
    }
  }

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Contact Enrichment
            </CardTitle>
            <CardDescription>
              Automatically enrich contact data from public sources
            </CardDescription>
          </div>
          <Button
            onClick={handleEnrich}
            disabled={enriching}
            variant="outline"
          >
            {enriching ? 'Enriching...' : 'Enrich Now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {enrichmentData ? (
          <div className="space-y-4">
            {/* Social Profiles */}
            {enrichmentData.socialProfiles && (
              <div>
                <h4 className="text-sm font-medium mb-2">Social Profiles</h4>
                <div className="space-y-2">
                  {enrichmentData.socialProfiles.linkedin && (
                    <div className="flex items-center gap-2 text-sm">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <a
                        href={enrichmentData.socialProfiles.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Info */}
            {enrichmentData.companyInfo && (
              <div>
                <h4 className="text-sm font-medium mb-2">Company Information</h4>
                <div className="space-y-2 text-sm">
                  {enrichmentData.companyInfo.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a
                        href={enrichmentData.companyInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {enrichmentData.companyInfo.website}
                      </a>
                    </div>
                  )}
                  {enrichmentData.companyInfo.industry && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{enrichmentData.companyInfo.industry}</span>
                    </div>
                  )}
                  {enrichmentData.companyInfo.employees && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Employees:</span>
                      <span>{enrichmentData.companyInfo.employees.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Status */}
            {enrichmentData.verified && (
              <div>
                <h4 className="text-sm font-medium mb-2">Verification Status</h4>
                <div className="flex items-center gap-2">
                  {enrichmentData.verified.email && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Mail className="w-3 h-3 mr-1" />
                      Email Verified
                    </Badge>
                  )}
                  {enrichmentData.verified.phone && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Phone className="w-3 h-3 mr-1" />
                      Phone Verified
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Click "Enrich Now" to fetch additional contact information</p>
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
