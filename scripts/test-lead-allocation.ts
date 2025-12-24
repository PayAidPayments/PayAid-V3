/**
 * Test script for Lead Allocation System
 * Run with: npx tsx scripts/test-lead-allocation.ts
 */

import { prisma } from '../lib/db/prisma'
import { autoAllocateLead, assignLeadToRep } from '../lib/sales-automation/lead-allocation'

async function testLeadAllocation() {
  console.log('🧪 Testing Lead Allocation System...\n')

  try {
    // Get a tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.log('❌ No tenant found. Please create a tenant first.')
      return
    }

    // Get or create a user
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant.id },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test-user@example.com',
          name: 'Test User',
          tenantId: tenant.id,
          role: 'admin',
        },
      })
      console.log('✅ Created test user')
    }

    // Create a sales rep
    let rep = await prisma.salesRep.findFirst({
      where: { userId: user.id },
    })

    if (!rep) {
      rep = await prisma.salesRep.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          specialization: 'Tech',
          conversionRate: 0.35, // 35%
        },
      })
      console.log('✅ Created sales rep:', rep.id)
    }

    // Get or create a test lead
    let lead = await prisma.contact.findFirst({
      where: {
        tenantId: tenant.id,
        type: 'lead',
      },
    })

    if (!lead) {
      lead = await prisma.contact.create({
        data: {
          name: 'Test Lead - Allocation',
          email: 'test-lead-allocation@example.com',
          company: 'Tech Corp',
          type: 'lead',
          status: 'active',
          tenantId: tenant.id,
        },
      })
      console.log('✅ Created test lead:', lead.id)
    }

    // Test 1: Auto-allocation
    console.log('\nTest 1: Auto-allocate lead')
    const allocation = await autoAllocateLead(lead, tenant.id)
    console.log(`  Best Rep: ${allocation.bestRep.rep.user.name}`)
    console.log(`  Score: ${allocation.bestRep.score}`)
    console.log(`  Reasons:`, allocation.bestRep.reasons)
    console.log(`  ✅ ${allocation.bestRep.rep.id === rep.id ? 'PASS' : 'FAIL'}`)

    // Test 2: Manual assignment
    console.log('\nTest 2: Manual assignment')
    await assignLeadToRep(lead.id, rep.id, tenant.id)
    const updatedLead = await prisma.contact.findUnique({
      where: { id: lead.id },
      include: { assignedTo: true },
    })
    console.log(`  Assigned To: ${updatedLead?.assignedTo?.user.name || 'None'}`)
    console.log(`  ✅ ${updatedLead?.assignedToId === rep.id ? 'PASS' : 'FAIL'}`)

    // Test 3: Leave status
    console.log('\nTest 3: Leave status handling')
    await prisma.salesRep.update({
      where: { id: rep.id },
      data: { isOnLeave: true },
    })
    const allocationWithLeave = await autoAllocateLead(lead, tenant.id)
    console.log(`  Rep on leave excluded: ${allocationWithLeave.bestRep.rep.id !== rep.id ? 'Yes' : 'No'}`)
    console.log(`  ✅ ${allocationWithLeave.bestRep.rep.id !== rep.id ? 'PASS' : 'FAIL'}`)

    // Reset leave status
    await prisma.salesRep.update({
      where: { id: rep.id },
      data: { isOnLeave: false },
    })

    console.log('\n✅ All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testLeadAllocation()
