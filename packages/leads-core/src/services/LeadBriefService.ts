import { prisma } from '@payaid/db'
import type { LeadBriefInput } from '../types'

export class LeadBriefService {
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
