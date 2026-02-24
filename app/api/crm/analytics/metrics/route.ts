/**
 * GET /api/crm/analytics/metrics
 * Phase 1A metrics: conversion rate, avg score→revenue, WhatsApp open rates.
 * All currency in ₹ INR.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const [contacts, deals, whatsappStats] = await Promise.all([
      prisma.contact.findMany({
        where: { tenantId },
        select: {
          id: true,
          stage: true,
          leadScore: true,
          predictedRevenue: true,
          whatsappStatus: true,
          createdAt: true,
        },
      }),
      prisma.deal.findMany({
        where: { tenantId, stage: 'won' },
        select: { contactId: true, value: true },
      }),
      prisma.contact.findMany({
        where: {
          tenantId,
          whatsappStatus: { not: null },
        },
        select: { whatsappStatus: true },
      }),
    ])

    const totalContacts = contacts.length
    const prospects = contacts.filter((c) => c.stage === 'prospect').length
    const customers = contacts.filter((c) => c.stage === 'customer').length
    const conversionRate = prospects + customers > 0
      ? Math.round((customers / (prospects + customers)) * 100)
      : 0

    const contactIdsWithDeals = new Set(deals.map((d) => d.contactId))
    const revenueByContact = new Map<string, number>()
    for (const d of deals) {
      if (d.contactId) {
        revenueByContact.set(d.contactId, (revenueByContact.get(d.contactId) || 0) + (d.value || 0))
      }
    }
    const contactsWithRevenue = contacts.filter((c) => revenueByContact.has(c.id))
    const avgScoreWithRevenue =
      contactsWithRevenue.length > 0
        ? Math.round(
            contactsWithRevenue.reduce((sum, c) => sum + (c.leadScore || 0), 0) / contactsWithRevenue.length
          )
        : 0
    const totalRevenueInr = Array.from(revenueByContact.values()).reduce((a, b) => a + b, 0)
    const avgRevenuePerScoredLead =
      contactsWithRevenue.length > 0 ? Math.round(totalRevenueInr / contactsWithRevenue.length) : 0

    let whatsappSent = 0
    let whatsappOpened = 0
    let whatsappReplied = 0
    for (const c of whatsappStats) {
      const s = c.whatsappStatus as { sent?: boolean; opened?: boolean; replied?: boolean } | null
      if (s?.sent) whatsappSent++
      if (s?.opened) whatsappOpened++
      if (s?.replied) whatsappReplied++
    }
    const whatsappOpenRate = whatsappSent > 0 ? Math.round((whatsappOpened / whatsappSent) * 100) : 0
    const whatsappReplyRate = whatsappSent > 0 ? Math.round((whatsappReplied / whatsappSent) * 100) : 0

    return NextResponse.json({
      conversionRate,
      totalProspects: prospects,
      totalCustomers: customers,
      totalContacts,
      avgScoreWithRevenue,
      totalRevenueInr,
      avgRevenuePerScoredLead,
      whatsappSent,
      whatsappOpened,
      whatsappReplied,
      whatsappOpenRate,
      whatsappReplyRate,
    })
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to load metrics', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
