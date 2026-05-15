import { prisma } from '@payaid/db'
import { toInputJson } from '../prisma-json'
import type { LeadBriefInput } from '../types'

export class LeadBriefService {
  async create(tenantId: string, createdById: string, input: LeadBriefInput) {
    return prisma.leadBrief.create({
      data: {
        tenantId,
        createdById,
        name: input.name,
        description: input.description,
        industryFilters: toInputJson(input.industryFilters),
        geoFilters: toInputJson(input.geoFilters),
        sizeFilters: toInputJson(input.sizeFilters),
        revenueFilters: toInputJson(input.revenueFilters ?? []),
        personaFilters: toInputJson(input.personaFilters),
        techFilters: toInputJson(input.techFilters ?? []),
        triggerFilters: toInputJson(input.triggerFilters ?? []),
        exclusionFilters: toInputJson(input.exclusionFilters ?? []),
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
        ...(input.industryFilters ? { industryFilters: toInputJson(input.industryFilters) } : {}),
        ...(input.geoFilters ? { geoFilters: toInputJson(input.geoFilters) } : {}),
        ...(input.sizeFilters ? { sizeFilters: toInputJson(input.sizeFilters) } : {}),
        ...(input.revenueFilters ? { revenueFilters: toInputJson(input.revenueFilters) } : {}),
        ...(input.personaFilters ? { personaFilters: toInputJson(input.personaFilters) } : {}),
        ...(input.techFilters ? { techFilters: toInputJson(input.techFilters) } : {}),
        ...(input.triggerFilters ? { triggerFilters: toInputJson(input.triggerFilters) } : {}),
        ...(input.exclusionFilters ? { exclusionFilters: toInputJson(input.exclusionFilters) } : {}),
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
