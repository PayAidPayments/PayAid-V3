import { prisma } from '@payaid/db'
import type { LeadBriefInput } from '../types'

export class LeadBriefService {
  compilePromptToBrief(prompt: string): LeadBriefInput {
    const normalized = prompt.trim()
    if (!normalized) {
      throw new Error('Prompt is required.')
    }

    const lower = normalized.toLowerCase()
    const industries = matchTokens(lower, [
      'saas',
      'fintech',
      'healthcare',
      'e-commerce',
      'manufacturing',
      'logistics',
      'real estate',
      'hospitality',
      'edtech',
      'agency',
    ])

    const personas = matchTokens(lower, [
      'founder',
      'co-founder',
      'ceo',
      'cfo',
      'coo',
      'cto',
      'head of sales',
      'vp sales',
      'sales manager',
      'head of marketing',
      'marketing manager',
      'operations manager',
      'hr manager',
    ])

    const geos = extractGeoHints(normalized)
    const sizeHints = extractSizeHints(lower)
    const techHints = matchTokens(lower, [
      'shopify',
      'wordpress',
      'hubspot',
      'salesforce',
      'stripe',
      'razorpay',
      'google ads',
      'meta ads',
      'zendesk',
    ])

    const triggerHints = matchTokens(lower, [
      'hiring',
      'funding',
      'expanding',
      'new office',
      'launch',
      'migration',
      'compliance',
      'cost cutting',
    ])

    return {
      name: buildBriefName(normalized, industries, geos),
      description: normalized,
      industryFilters: industries.map((industry) => ({ type: 'industry', value: industry })),
      geoFilters: geos.map((geo) => ({ type: 'geo', value: geo })),
      sizeFilters: sizeHints.map((size) => ({ type: 'employeeBand', value: size })),
      revenueFilters: [],
      personaFilters: personas.map((persona) => ({ type: 'persona', value: persona })),
      techFilters: techHints.map((tech) => ({ type: 'tech', value: tech })),
      triggerFilters: triggerHints.map((trigger) => ({ type: 'trigger', value: trigger })),
      exclusionFilters: [],
    }
  }

  async create(tenantId: string, createdById: string, input: LeadBriefInput) {
    return prisma.leadBrief.create({
      data: {
        tenantId,
        createdById,
        name: input.name,
        description: input.description,
        industryFilters: input.industryFilters,
        geoFilters: input.geoFilters,
        sizeFilters: input.sizeFilters,
        revenueFilters: input.revenueFilters ?? [],
        personaFilters: input.personaFilters,
        techFilters: input.techFilters ?? [],
        triggerFilters: input.triggerFilters ?? [],
        exclusionFilters: input.exclusionFilters ?? [],
      },
    })
  }

  async update(tenantId: string, briefId: string, input: Partial<LeadBriefInput>) {
    const existing = await prisma.leadBrief.findFirst({ where: { id: briefId, tenantId }, select: { id: true } })
    if (!existing) {
      throw new Error('Lead brief not found.')
    }

    return prisma.leadBrief.update({
      where: { id: briefId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.industryFilters ? { industryFilters: input.industryFilters } : {}),
        ...(input.geoFilters ? { geoFilters: input.geoFilters } : {}),
        ...(input.sizeFilters ? { sizeFilters: input.sizeFilters } : {}),
        ...(input.revenueFilters ? { revenueFilters: input.revenueFilters } : {}),
        ...(input.personaFilters ? { personaFilters: input.personaFilters } : {}),
        ...(input.techFilters ? { techFilters: input.techFilters } : {}),
        ...(input.triggerFilters ? { triggerFilters: input.triggerFilters } : {}),
        ...(input.exclusionFilters ? { exclusionFilters: input.exclusionFilters } : {}),
      },
    })
  }

  async run(tenantId: string, briefId: string) {
    const segment = await prisma.leadSegment.create({
      data: {
        tenantId,
        briefId,
        name: `Run ${new Date().toISOString()}`,
        discoveryState: 'QUEUED',
        status: 'RUNNING',
      },
    })

    return { jobId: `leadBrief.runDiscovery:${segment.id}`, segmentId: segment.id }
  }
}

function matchTokens(input: string, tokens: string[]): string[] {
  return tokens.filter((token) => input.includes(token)).map((token) => toTitle(token))
}

function toTitle(value: string) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function extractGeoHints(prompt: string): string[] {
  const matches = prompt.match(/\b(?:in|across|targeting)\s+([A-Za-z][A-Za-z\s,&-]{2,30})/gi) ?? []
  const cleaned = matches
    .map((match) => match.replace(/^(in|across|targeting)\s+/i, '').trim())
    .filter(Boolean)
  return Array.from(new Set(cleaned))
}

function extractSizeHints(lowerPrompt: string): string[] {
  const hints: string[] = []
  if (lowerPrompt.includes('1-10') || lowerPrompt.includes('small business')) hints.push('1-10')
  if (lowerPrompt.includes('11-50') || lowerPrompt.includes('startup')) hints.push('11-50')
  if (lowerPrompt.includes('51-200') || lowerPrompt.includes('mid market')) hints.push('51-200')
  if (lowerPrompt.includes('201-500') || lowerPrompt.includes('enterprise')) hints.push('201-500')
  return hints
}

function buildBriefName(prompt: string, industries: string[], geos: string[]) {
  const industry = industries[0] ?? 'Prospects'
  const geo = geos[0] ? ` - ${geos[0]}` : ''
  return `${industry}${geo} (${prompt.slice(0, 30)})`
}
