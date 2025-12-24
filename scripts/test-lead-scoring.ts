/**
 * Test script for Lead Scoring System
 * Run with: npx tsx scripts/test-lead-scoring.ts
 */

import { prisma } from '../lib/db/prisma'
import { scoreLead, getScoreCategory } from '../lib/ai-helpers/lead-scoring'

async function testLeadScoring() {
  console.log('🧪 Testing Lead Scoring System...\n')

  try {
    // Test 1: Get a lead with no activity
    console.log('Test 1: Lead with no activity')
    const coldLead = await prisma.contact.findFirst({
      where: { type: 'lead' },
      include: {
        interactions: true,
        deals: true,
      },
    })

    if (coldLead) {
      const { score, components } = await scoreLead(coldLead)
      const category = getScoreCategory(score)
      console.log(`  Lead: ${coldLead.name}`)
      console.log(`  Score: ${score}`)
      console.log(`  Category: ${category.label} ${category.icon}`)
      console.log(`  Components:`, components)
      console.log(`  Expected: 10-20 (cold)`)
      console.log(`  ✅ ${score >= 10 && score <= 20 ? 'PASS' : 'FAIL'}\n`)
    }

    // Test 2: Create a test lead with interactions
    console.log('Test 2: Lead with 5 interactions')
    const testLead = await prisma.contact.create({
      data: {
        name: 'Test Lead - High Activity',
        email: 'test-lead@example.com',
        type: 'lead',
        status: 'active',
        tenantId: (await prisma.tenant.findFirst())?.id || '',
      },
    })

    // Add 5 interactions
    for (let i = 0; i < 5; i++) {
      await prisma.interaction.create({
        data: {
          contactId: testLead.id,
          type: 'email',
          subject: `Test Email ${i + 1}`,
          notes: 'Test interaction',
        },
      })
    }

    const { score: score2, components: components2 } = await scoreLead(testLead)
    const category2 = getScoreCategory(score2)
    console.log(`  Lead: ${testLead.name}`)
    console.log(`  Score: ${score2}`)
    console.log(`  Category: ${category2.label} ${category2.icon}`)
    console.log(`  Components:`, components2)
    console.log(`  Expected: 40-70 (warm)`)
    console.log(`  ✅ ${score2 >= 40 && score2 <= 70 ? 'PASS' : 'FAIL'}\n`)

    // Test 3: Add deals to make it hot
    console.log('Test 3: Lead with interactions + deals')
    await prisma.deal.create({
      data: {
        name: 'Test Deal',
        value: 50000,
        probability: 75,
        stage: 'qualified',
        contactId: testLead.id,
        tenantId: testLead.tenantId,
      },
    })

    const updatedLead = await prisma.contact.findUnique({
      where: { id: testLead.id },
      include: {
        interactions: true,
        deals: true,
      },
    })

    if (updatedLead) {
      const { score: score3, components: components3 } = await scoreLead(updatedLead)
      const category3 = getScoreCategory(score3)
      console.log(`  Lead: ${updatedLead.name}`)
      console.log(`  Score: ${score3}`)
      console.log(`  Category: ${category3.label} ${category3.icon}`)
      console.log(`  Components:`, components3)
      console.log(`  Expected: 70-100 (hot)`)
      console.log(`  ✅ ${score3 >= 70 ? 'PASS' : 'FAIL'}\n`)
    }

    // Cleanup
    await prisma.contact.delete({ where: { id: testLead.id } })
    console.log('✅ All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testLeadScoring()
