/**
 * CRM Module Seeder for Demo Business
 * Seeds: Contacts, Deals, Tasks, Activities, Notes, Meetings
 * Date Range: March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, distributeAcrossMonths, getMonthsInRange, ensureMonthlyDistribution } from './date-utils'

const prisma = new PrismaClient()

export interface CRMSeedResult {
  contacts: number
  deals: number
  tasks: number
  activities: number
  notes: number
  meetings: number
}

export async function seedCRMModule(
  tenantId: string,
  userId: string,
  salesRepId: string,
  range: DateRange = DEMO_DATE_RANGE,
  prismaClient?: PrismaClient
): Promise<CRMSeedResult> {
  // Use provided client (required to avoid connection pool exhaustion)
  if (!prismaClient) {
    throw new Error('PrismaClient must be provided to seedCRMModule')
  }
  const client = prismaClient
  console.log('📇 Seeding CRM Module...')

  // 1. CONTACTS - 150 contacts distributed across 12 months
  const contactNames = [
    // Month 1-2 (Mar-Apr 2025)
    { name: 'Rajesh Kumar', email: 'rajesh@techcorp.com', phone: '+91-9876543210', company: 'TechCorp Solutions', source: 'Website' },
    { name: 'Priya Sharma', email: 'priya@digitalmarketing.com', phone: '+91-9876543211', company: 'Digital Marketing Pro', source: 'LinkedIn' },
    { name: 'Amit Patel', email: 'amit@startupxyz.com', phone: '+91-9876543212', company: 'StartupXYZ', source: 'Referral' },
    { name: 'Sneha Reddy', email: 'sneha@enterprise.com', phone: '+91-9876543213', company: 'Enterprise Solutions', source: 'Google Ads' },
    { name: 'Vikram Singh', email: 'vikram@corpventures.com', phone: '+91-9876543214', company: 'Corporate Ventures', source: 'Website' },
    { name: 'Anjali Mehta', email: 'anjali@services.com', phone: '+91-9876543215', company: 'Service Providers Ltd', source: 'Facebook' },
    { name: 'Rahul Gupta', email: 'rahul@digitalagency.com', phone: '+91-9876543216', company: 'Digital Agency', source: 'LinkedIn' },
    { name: 'Suresh Iyer', email: 'suresh@supplychain.com', phone: '+91-9876543217', company: 'Supply Chain Co', source: 'Referral' },
    { name: 'Meera Nair', email: 'meera@logistics.com', phone: '+91-9876543218', company: 'Logistics Solutions', source: 'Website' },
    { name: 'Kiran Desai', email: 'kiran@prospect.com', phone: '+91-9876543219', company: 'Prospect Industries', source: 'Google Ads' },
    { name: 'Arjun Menon', email: 'arjun@client.com', phone: '+91-9876543220', company: 'Client Services Inc', source: 'Referral' },
    { name: 'Divya Rao', email: 'divya@partner.com', phone: '+91-9876543221', company: 'Partner Network', source: 'LinkedIn' },
    { name: 'Nikhil Joshi', email: 'nikhil@hotlead.com', phone: '+91-9876543222', company: 'Hot Lead Corp', source: 'Website' },
    { name: 'Pooja Shah', email: 'pooja@newlead.com', phone: '+91-9876543223', company: 'New Lead Solutions', source: 'Facebook' },
    { name: 'Manish Agarwal', email: 'manish@bigdeal.com', phone: '+91-9876543224', company: 'Big Deal Enterprises', source: 'Google Ads' },
    { name: 'Swati Verma', email: 'swati@customer.com', phone: '+91-9876543225', company: 'Customer First Ltd', source: 'Referral' },
    { name: 'Rohit Malhotra', email: 'rohit@enterprise.com', phone: '+91-9876543226', company: 'Enterprise Group', source: 'LinkedIn' },
    { name: 'Aditya Kapoor', email: 'aditya@innovations.com', phone: '+91-9876543227', company: 'Tech Innovations', source: 'Website' },
    { name: 'Kavita Nair', email: 'kavita@business.com', phone: '+91-9876543228', company: 'Business Growth Co', source: 'Facebook' },
    { name: 'Ravi Shankar', email: 'ravi@ventures.com', phone: '+91-9876543229', company: 'Venture Capital Partners', source: 'LinkedIn' },
    // Add more contacts to reach 150...
  ]

  // Generate additional contacts to reach 150
  const additionalContacts = Array.from({ length: 130 }, (_, i) => ({
    name: `Contact ${i + 21}`,
    email: `contact${i + 21}@example.com`,
    phone: `+91-9876543${String(230 + i).padStart(3, '0')}`,
    company: `Company ${i + 21}`,
    source: ['Website', 'LinkedIn', 'Referral', 'Google Ads', 'Facebook', 'Event'][i % 6],
  }))

  const allContactData = [...contactNames, ...additionalContacts]
  const contactDates = distributeAcrossMonths(allContactData, range)

  // Create contacts in batches to avoid connection pool exhaustion
  // CRITICAL: Use Promise.allSettled to allow individual failures without stopping the batch
  const contacts = []
  const batchSize = 5 // Very small batch size to avoid connection pool exhaustion
  let contactErrors = 0
  
  console.log(`  📋 Creating ${contactDates.length} contacts in batches of ${batchSize}...`)
  
  for (let i = 0; i < contactDates.length; i += batchSize) {
    const batch = contactDates.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map(({ item, date }, batchIdx) => {
        const idx = i + batchIdx
        return client.contact.create({
          data: {
            tenantId,
            name: item.name,
            email: item.email,
            phone: item.phone,
            company: item.company,
            source: item.source,
            stage: idx % 3 === 0 ? 'customer' : idx % 3 === 1 ? 'contact' : 'prospect',
            status: 'active',
            address: `${idx + 1}${idx % 2 === 0 ? ' Main Street' : ' Park Avenue'}`,
            city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'][idx % 5],
            state: ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana'][idx % 5],
            postalCode: ['560001', '400053', '110001', '600001', '500001'][idx % 5],
            country: 'India',
            leadScore: Math.floor(Math.random() * 100),
            assignedToId: salesRepId, // CRITICAL: Set assignedToId so dashboard API can filter by user
            createdAt: date,
            lastContactedAt: idx % 5 === 0 ? randomDateInRange({ start: date, end: range.end }) : null,
          },
        })
      })
    )
    
    // Process results - collect successful contacts and log errors
    const successful = batchResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
    const failed = batchResults.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    
    contacts.push(...successful)
    contactErrors += failed.length
    
    if (failed.length > 0) {
      console.error(`  ❌ Failed to create ${failed.length} contacts in batch ${Math.floor(i / batchSize) + 1}:`)
      failed.forEach((failure, idx) => {
        console.error(`    Contact ${i + idx + 1}: ${failure.reason?.message || String(failure.reason)}`)
        if (failure.reason?.code) {
          console.error(`      Error code: ${failure.reason.code}`)
        }
        if (failure.reason?.meta) {
          console.error(`      Error meta:`, failure.reason.meta)
        }
      })
    }
    
    // Progress logging
    if ((i + batchSize) % 50 === 0 || i + batchSize >= contactDates.length) {
      console.log(`  ✓ Progress: Created ${contacts.length}/${contactDates.length} contacts (${contactErrors} errors)`)
    }
    
    // Longer delay between batches to allow connection pool to recover
    if (i + batchSize < contactDates.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${contacts.length} contacts (${contactErrors} errors)`)
  
  // CRITICAL: Verify contacts were actually created in database
  let actualContactCount = 0
  try {
    actualContactCount = await client.contact.count({ where: { tenantId } })
    console.log(`  🔍 Verification: ${actualContactCount} contacts exist in database (expected: ${contacts.length})`)
    
    if (actualContactCount === 0 && contactDates.length > 0) {
      console.error(`  ❌ CRITICAL: No contacts were created despite ${contactDates.length} attempts!`)
      console.error(`  ❌ Contact errors: ${contactErrors}`)
      if (contactDates.length > 0) {
        console.error(`  ❌ First contact data sample:`, JSON.stringify(contactDates[0], null, 2))
      }
      throw new Error(`No contacts created: ${contactDates.length} attempts, ${contactErrors} errors. Check database connection and constraints.`)
    }
    
    if (actualContactCount < contacts.length * 0.5) {
      console.warn(`  ⚠️  WARNING: Only ${actualContactCount} contacts in database, expected ${contacts.length}`)
      console.warn(`  ⚠️  This may indicate database connection issues or constraint violations`)
    }
  } catch (verifyError: any) {
    if (verifyError?.message?.includes('No contacts created')) {
      throw verifyError // Re-throw our custom errors
    }
    console.error(`  ❌ Error verifying contacts:`, verifyError?.message || String(verifyError))
  }

  // 2. DEALS - 200 deals distributed across ALL 12 months (Mar 2025 - Feb 2026)
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  
  // CRITICAL: Verify we have contacts before creating deals (check database, not just array)
  const verifiedContactCount = actualContactCount > 0 ? actualContactCount : contacts.length
  if (verifiedContactCount === 0) {
    console.error('  ❌ CRITICAL: No contacts available to create deals!')
    console.error(`  ❌ Contacts array: ${contacts.length}, Database count: ${actualContactCount}`)
    console.error(`  ❌ Contact errors during creation: ${contactErrors}`)
    console.error('  ❌ Cannot create deals without contacts. Seed will fail.')
    throw new Error(`No contacts created: ${contactDates.length} attempts, ${contactErrors} errors. Cannot create deals without contacts.`)
  }
  
  // Refresh contacts from database to ensure we have the actual created contacts
  let verifiedContacts = contacts
  if (actualContactCount > contacts.length) {
    console.log(`  🔄 Refreshing contacts from database (found ${actualContactCount} vs ${contacts.length} in array)...`)
    verifiedContacts = await client.contact.findMany({ 
      where: { tenantId },
      take: Math.min(actualContactCount, 200), // Get up to 200 contacts for deal creation
    })
    console.log(`  ✓ Using ${verifiedContacts.length} contacts from database for deal creation`)
  }
  
  console.log(`  📋 Creating deals using ${verifiedContacts.length} available contacts...`)
  
  const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  const months = getMonthsInRange(range)
  const dealsPerMonth = Math.floor(200 / months.length) // ~17 deals per month
  const dealData: Array<{
    tenantId: string
    name: string
    value: number
    stage: string
    probability: number
    contactId: string
    assignedToId?: string
    createdAt: Date
    expectedCloseDate: Date | null
    actualCloseDate: Date | null
    lostReason: string | null
  }> = []
  
  let dealIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const dealsThisMonth = monthIdx === months.length - 1 
      ? 200 - dealIndex // Last month gets remaining deals
      : dealsPerMonth
    
    for (let i = 0; i < dealsThisMonth && dealIndex < 200; i++) {
      const stage = dealStages[Math.floor(Math.random() * dealStages.length)]
      const contact = verifiedContacts[Math.floor(Math.random() * verifiedContacts.length)]
      const createdAt = randomDateInRange({ start: monthStart, end: monthEnd })
    
      // Won deals should have actualCloseDate
      // Lost deals should have lostReason
      const isWon = stage === 'won'
      const isLost = stage === 'lost'
      const actualCloseDate = isWon ? randomDateInRange({ start: createdAt, end: monthEnd > range.end ? range.end : monthEnd }) : null
      const expectedCloseDate = !isWon && !isLost ? randomDateInRange({ start: createdAt, end: range.end }) : null
      
      const payload: {
        tenantId: string
        name: string
        value: number
        stage: string
        probability: number
        contactId: string
        createdAt: Date
        expectedCloseDate: Date | null
        actualCloseDate: Date | null
        lostReason: string | null
        assignedToId?: string
      } = {
        tenantId,
        name: `Deal ${dealIndex + 1} - ${contact.company}`,
        value: Math.floor(Math.random() * 500000) + 10000,
        stage,
        probability: isWon ? 100 : isLost ? 0 : Math.floor(Math.random() * 80) + 20,
        contactId: contact.id,
        createdAt,
        expectedCloseDate,
        actualCloseDate,
        lostReason: isLost ? ['Budget constraints', 'Chose competitor', 'Timeline mismatch', 'No longer needed'][Math.floor(Math.random() * 4)] : null,
      }
      if (salesRepId) payload.assignedToId = salesRepId
      dealData.push(payload)
      dealIndex++
    }
  }

  // Create deals in batches
  console.log(`  📊 Prepared ${dealData.length} deals to create`)
  console.log(`  📊 Using salesRepId: ${salesRepId || 'MISSING (deals will be created without assignedToId)'}`)
  
  // Test creating a single deal first to catch any errors early
  if (dealData.length > 0) {
    try {
      const testDeal = dealData[0]
      console.log(`  🧪 Testing deal creation with sample deal:`, {
        tenantId: testDeal.tenantId,
        contactId: testDeal.contactId,
        assignedToId: testDeal.assignedToId || 'none',
        name: testDeal.name.substring(0, 50),
      })
      const testResult = await client.deal.create({ data: testDeal })
      console.log(`  ✅ Test deal created successfully: ${testResult.id}`)
      // Delete the test deal - we'll create it again in the batch
      await client.deal.delete({ where: { id: testResult.id } }).catch(() => {})
      console.log(`  ✅ Test deal cleaned up`)
    } catch (testError: any) {
      console.error(`  ❌ CRITICAL: Test deal creation FAILED!`)
      console.error(`  ❌ Error: ${testError?.message || String(testError)}`)
      console.error(`  ❌ Error code: ${testError?.code || 'N/A'}`)
      console.error(`  ❌ Error meta:`, testError?.meta || 'N/A')
      console.error(`  ❌ This means ALL deals will fail. Fix this error first.`)
      throw new Error(`Deal creation test failed: ${testError?.message || String(testError)}`)
    }
  }
  
  const deals = []
  // CRITICAL: Use sequential creation when connection_limit=1 to avoid connection pool exhaustion
  // With only 1 connection, parallel creation can cause timeouts or connection errors
  const useSequential = true // Always use sequential for reliability
  let dealErrors = 0
  
  if (useSequential) {
    // Create deals one at a time (more reliable with connection_limit=1)
    console.log(`  📊 Creating ${dealData.length} deals sequentially (to avoid connection pool issues)...`)
    for (let i = 0; i < dealData.length; i++) {
      try {
        const deal = await client.deal.create({ data: dealData[i] })
        deals.push(deal)
        
        if ((i + 1) % 50 === 0) {
          console.log(`  ✓ Progress: Created ${deals.length}/${dealData.length} deals (${dealErrors} errors)`)
        }
        
        // Small delay every 10 deals to prevent overwhelming the connection
        if ((i + 1) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      } catch (dealError: any) {
        dealErrors++
        console.error(`  ❌ Failed to create deal ${i + 1}: ${dealError?.message || String(dealError)}`)
        if (dealError?.code) {
          console.error(`      Error code: ${dealError.code}`)
        }
        if (dealError?.meta) {
          console.error(`      Error meta:`, dealError.meta)
        }
        // Continue with next deal instead of stopping
      }
    }
  } else {
    // Original batch creation (kept as fallback)
    const dealBatchSize = 5
    for (let i = 0; i < dealData.length; i += dealBatchSize) {
      const batch = dealData.slice(i, i + dealBatchSize)
      try {
        const batchResults = await Promise.allSettled(
          batch.map((deal) => client.deal.create({ data: deal }))
        )
        const successful = batchResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
        const failed = batchResults.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        
        deals.push(...successful)
        dealErrors += failed.length
        
        if (failed.length > 0) {
          console.error(`  ❌ Failed to create ${failed.length} deals in batch ${Math.floor(i / dealBatchSize) + 1}:`)
          failed.forEach((failure, idx) => {
            console.error(`    Deal ${i + idx + 1}: ${failure.reason?.message || String(failure.reason)}`)
            if (failure.reason?.code) {
              console.error(`      Error code: ${failure.reason.code}`)
            }
            if (failure.reason?.meta) {
              console.error(`      Error meta:`, failure.reason.meta)
            }
          })
        }
        
        if (i % 50 === 0 && i > 0) {
          console.log(`  ✓ Progress: Created ${deals.length}/${dealData.length} deals (${dealErrors} errors)`)
        }
      } catch (batchError: any) {
        console.error(`  ❌ Batch error at index ${i}:`, batchError?.message || String(batchError))
        dealErrors += batch.length
      }
      
      if (i + dealBatchSize < dealData.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
  
  if (dealErrors > 0) {
    console.warn(`  ⚠️  WARNING: ${dealErrors} deals failed to create out of ${dealData.length} attempted`)
  }

  // Add deals closing within next 7 days with high probability (for AI insights)
  // Note: Current month deals are created separately below (line ~539)
  // Only create if we have contacts and salesRepId
  const dealsClosingSoon = []
  if (verifiedContacts.length > 0 && salesRepId) {
    try {
      const now = new Date()
      const closingStages = ['proposal', 'negotiation'] // Stages that should have expectedCloseDate
      
      // Create 5-10 deals closing within 7 days with high probability
      const numClosingDeals = Math.floor(Math.random() * 6) + 5 // 5-10 deals
      for (let i = 0; i < numClosingDeals && i < verifiedContacts.length; i++) {
        const contact = verifiedContacts[Math.floor(Math.random() * verifiedContacts.length)]
        const daysFromNow = Math.floor(Math.random() * 7) + 1 // 1-7 days from now
        const expectedCloseDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000)
        const stage = closingStages[Math.floor(Math.random() * closingStages.length)]
        const probability = Math.floor(Math.random() * 30) + 70 // 70-100% probability
        
        try {
          const closingDeal = await client.deal.create({
            data: {
              tenantId,
              name: `Deal Closing Soon ${i + 1} - ${contact.company || contact.name || 'Company'}`,
              value: Math.floor(Math.random() * 300000) + 50000, // ₹50k - ₹3.5L
              stage,
              probability,
              contactId: contact.id,
              assignedToId: salesRepId,
              createdAt: new Date(now.getTime() - (30 - daysFromNow) * 24 * 60 * 60 * 1000), // Created 30-daysFromNow days ago
              expectedCloseDate,
            }
          })
          dealsClosingSoon.push(closingDeal)
        } catch (error: any) {
          console.warn(`  ⚠️ Failed to create closing deal ${i + 1}:`, error?.message || error)
          // Continue with next deal instead of failing completely
        }
      }
      console.log(`  ✓ Created ${dealsClosingSoon.length} deals closing within 7 days`)
    } catch (error: any) {
      console.warn(`  ⚠️ Error creating closing deals:`, error?.message || error)
      // Don't fail the entire seed if this fails
    }
  } else {
    console.log(`  ⚠️ Skipping closing deals creation: contacts=${verifiedContacts.length}, salesRepId=${!!salesRepId}`)
  }

  console.log(`  ✓ Created ${deals.length} deals total (${dealsClosingSoon.length} closing within 7 days)`)
  
  // CRITICAL: Verify deals were actually created in database
  let actualDealCount = 0
  try {
    actualDealCount = await client.deal.count({ where: { tenantId } })
    console.log(`  🔍 Verification: ${actualDealCount} deals exist in database (expected: ${deals.length})`)
    
    if (actualDealCount === 0 && deals.length > 0) {
      console.error(`  ❌ CRITICAL: Deals array has ${deals.length} deals but database shows 0!`)
      console.error(`  ❌ This suggests a transaction rollback or connection issue`)
      // Try to fetch one deal to see what's in the database
      const sampleDeal = await client.deal.findFirst({ where: { tenantId } })
      console.error(`  ❌ Sample deal from DB:`, sampleDeal ? 'Found' : 'Not found')
      throw new Error(`Deal creation verification failed: ${deals.length} deals created but database shows 0`)
    }
    
    if (actualDealCount === 0 && dealData.length > 0) {
      console.error(`  ❌ CRITICAL: No deals were created despite ${dealData.length} attempts!`)
      console.error(`  ❌ Deal errors: ${dealErrors}`)
      if (dealData.length > 0) {
        console.error(`  ❌ First deal data sample:`, JSON.stringify(dealData[0], null, 2))
      }
      // Check if contacts exist
      const contactCount = await client.contact.count({ where: { tenantId } })
      console.error(`  ❌ Contacts available: ${contactCount}`)
      console.error(`  ❌ SalesRep ID: ${salesRepId || 'MISSING'}`)
      throw new Error(`No deals created: ${dealData.length} attempts, ${dealErrors} errors. Check contacts (${contactCount}) and salesRepId (${salesRepId || 'MISSING'})`)
    }
  } catch (verifyError: any) {
    if (verifyError?.message?.includes('No deals created') || verifyError?.message?.includes('verification failed')) {
      throw verifyError // Re-throw our custom errors
    }
    console.error(`  ❌ Error verifying deals:`, verifyError?.message || String(verifyError))
  }

  // 3. TASKS - 300 tasks distributed across ALL 12 months (Mar 2025 - Feb 2026)
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const taskData: Array<{
    title: string
    description: string
    priority: string
    status: string
    dueDate: Date
    completedAt: Date | null
    contactId: string
    assignedToId: string
    tenantId: string
    createdAt: Date
  }> = []
  
  const tasksPerMonth = Math.floor(300 / months.length) // ~25 tasks per month
  let taskIndex = 0
  
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const tasksThisMonth = monthIdx === months.length - 1 
      ? 300 - taskIndex // Last month gets remaining tasks
      : tasksPerMonth
    
    for (let i = 0; i < tasksThisMonth && taskIndex < 300; i++) {
      const contact = verifiedContacts[Math.floor(Math.random() * verifiedContacts.length)]
      const createdAt = randomDateInRange({ start: monthStart, end: monthEnd })
      const dueDate = randomDateInRange({ start: createdAt, end: range.end })
      const status = Math.random() > 0.3 ? 'pending' : Math.random() > 0.5 ? 'in_progress' : 'completed'
      const completedAt = status === 'completed' ? randomDateInRange({ start: dueDate, end: range.end }) : null
      
      taskData.push({
        title: `Task ${taskIndex + 1}: ${['Follow up', 'Prepare proposal', 'Schedule meeting', 'Send quote', 'Review contract'][taskIndex % 5]}`,
        description: `Task description for ${contact.name}`,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status,
        dueDate,
        completedAt,
        contactId: contact.id,
        assignedToId: userId,
        tenantId,
        createdAt,
      })
      taskIndex++
    }
  }

  // Create tasks SEQUENTIALLY to avoid connection pool exhaustion
  const tasks = []
  for (let i = 0; i < taskData.length; i++) {
    try {
      const task = taskData[i]
      const createdTask = await client.task.create({ data: task })
      tasks.push(createdTask)
      
      // Small delay every 10 tasks to allow connection pool recovery
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to create task ${i + 1}:`, error?.message || error)
      // Continue with next task instead of failing completely
    }
  }

  console.log(`  ✓ Created ${tasks.length} tasks`)

  // 4. ACTIVITY FEED - 500 activity feed entries distributed across ALL 12 months
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const activityTypes = ['create', 'update', 'comment', 'delete']
  const entityTypes = ['deal', 'contact', 'task']
  
  const activityFeedData: Array<{
    tenantId: string
    type: string
    entityType: string
    entityId: string
    userId: string
    description: string
    metadata: {}
    createdAt: Date
  }> = []
  
  const activitiesPerMonth = Math.floor(500 / months.length) // ~42 activities per month
  let activityIndex = 0
  
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const activitiesThisMonth = monthIdx === months.length - 1 
      ? 500 - activityIndex // Last month gets remaining activities
      : activitiesPerMonth
    
    for (let i = 0; i < activitiesThisMonth && activityIndex < 500; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
      const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)]
      const createdAt = randomDateInRange({ start: monthStart, end: monthEnd })
    
      let entityId: string
      if (entityType === 'deal' && deals.length > 0) {
        entityId = deals[Math.floor(Math.random() * deals.length)].id
      } else if (entityType === 'contact' && verifiedContacts.length > 0) {
        entityId = verifiedContacts[Math.floor(Math.random() * verifiedContacts.length)].id
      } else if (tasks.length > 0) {
        // entityType === 'task'
        entityId = tasks[Math.floor(Math.random() * tasks.length)].id
      } else {
        // Fallback if no entities exist yet
        entityId = contacts[0]?.id || 'fallback-id'
      }
      
      activityFeedData.push({
        tenantId,
        type,
        entityType,
        entityId,
        userId,
        description: `${type} ${entityType}`,
        metadata: {},
        createdAt,
      })
      activityIndex++
    }
  }

  // Create activity feeds SEQUENTIALLY to avoid connection pool exhaustion
  const activityFeeds = []
  for (let i = 0; i < activityFeedData.length; i++) {
    try {
      const activity = activityFeedData[i]
      const createdActivity = await client.activityFeed.create({ data: activity }).catch(() => null)
      if (createdActivity) {
        activityFeeds.push(createdActivity)
      }
      
      // Small delay every 10 activities to allow connection pool recovery
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error: any) {
      // Silently continue - activity feeds are non-critical
    }
  }

  console.log(`  ✓ Created ${activityFeeds.filter(Boolean).length} activity feed entries`)

  // 5. MEETINGS - 100 meetings distributed across ALL 12 months (Mar 2025 - Feb 2026)
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const meetings = []
  const meetingsPerMonth = Math.floor(100 / months.length) // ~8 meetings per month
  const meetingData: Array<{
    tenantId: string
    title: string
    description: string
    meetingCode: string
    startTime: Date
    endTime: Date
    status: string
    hostId: string
    createdById: string
    createdAt: Date
  }> = []
  
  let meetingIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const meetingsThisMonth = monthIdx === months.length - 1 
      ? 100 - meetingIndex // Last month gets remaining meetings
      : meetingsPerMonth
    
    for (let i = 0; i < meetingsThisMonth && meetingIndex < 100; i++) {
      const startTime = randomDateInRange({ start: monthStart, end: monthEnd })
      meetingData.push({
        tenantId,
        title: `Meeting ${meetingIndex + 1}`,
        description: `Meeting discussion`,
        meetingCode: `MEET-${String(meetingIndex + 1).padStart(8, '0')}-${Date.now()}-${meetingIndex}`,
        startTime,
        endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
        status: startTime > new Date() ? 'scheduled' : 'ended',
        hostId: userId,
        createdById: userId,
        createdAt: startTime,
      })
      meetingIndex++
    }
  }
  
  // Create meetings SEQUENTIALLY to avoid connection pool exhaustion
  for (let i = 0; i < meetingData.length; i++) {
    try {
      const data = meetingData[i]
      const createdMeeting = await client.meeting.create({ data }).catch(() => null)
      if (createdMeeting) {
        meetings.push(createdMeeting)
      }
      
      // Small delay every 10 meetings to allow connection pool recovery
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error: any) {
      // Silently continue - meetings are non-critical
    }
  }

  console.log(`  ✓ Created ${meetings.filter(Boolean).length} meetings`)

  // CRITICAL: Create current month data for dashboard stats
  // Historical data is in March 2025 - Feb 2026, but dashboard queries current month
  console.log(`  📅 Creating current month data for dashboard...`)
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  console.log(`  📅 Current month range: ${currentMonthStart.toISOString()} to ${currentMonthEnd.toISOString()}`)
  console.log(`  📅 Current date: ${now.toISOString()}`)
  console.log(`  📅 Current month: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  
  // Create 20 contacts in current month
  const currentMonthContacts = []
  for (let i = 0; i < 20; i++) {
    const dayInMonth = Math.min((i % 28) + 1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
    const createdAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
    try {
      const contact = await client.contact.create({
        data: {
          tenantId,
          name: `Current Month Contact ${i + 1}`,
          email: `current${i + 1}@example.com`,
          phone: `+91-9876544${String(i).padStart(3, '0')}`,
          company: `Current Co ${i + 1}`,
          source: ['Website', 'LinkedIn', 'Referral', 'Google Ads'][i % 4],
          stage: i % 3 === 0 ? 'customer' : i % 3 === 1 ? 'contact' : 'prospect',
          status: 'active',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          assignedToId: salesRepId, // CRITICAL: Set assignedToId to SalesRep.id (not userId)
          createdAt,
        },
      })
      currentMonthContacts.push(contact)
      if (i === 0 || i === 19) {
        console.log(`  ✓ Created current month contact ${i + 1}: ${contact.id}`)
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to create current month contact ${i + 1}:`, err?.message || err)
      console.error(`  Error details:`, {
        error: err?.message,
        code: err?.code,
        meta: err?.meta,
        tenantId,
        createdAt: createdAt.toISOString(),
      })
    }
  }
  console.log(`  ✓ Created ${currentMonthContacts.length} contacts in current month`)
  
  // Verify contacts were created with correct dates
  if (currentMonthContacts.length > 0) {
    const verifyContact = await client.contact.findUnique({
      where: { id: currentMonthContacts[0].id },
      select: { id: true, name: true, createdAt: true },
    })
    console.log(`  ✓ Verified first contact: ${verifyContact?.name} created at ${verifyContact?.createdAt?.toISOString()}`)
  }
  
  // Create 15 deals in current month
  const currentMonthDeals = []
  const allContactsForDeals = [...contacts, ...currentMonthContacts]
  for (let i = 0; i < 15 && allContactsForDeals.length > 0; i++) {
    const dayInMonth = Math.min((i % 28) + 1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
    const createdAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
    const contact = allContactsForDeals[i % allContactsForDeals.length]
    const stage = ['lead', 'qualified', 'proposal', 'negotiation'][i % 4]
    try {
      const deal = await client.deal.create({
        data: {
          tenantId,
          name: `Current Month Deal ${i + 1} - ${contact.company || 'Unknown'}`,
          value: Math.floor(Math.random() * 500000) + 10000,
          stage: stage as any,
          probability: Math.floor(Math.random() * 80) + 20,
          contactId: contact.id,
          assignedToId: salesRepId, // CRITICAL: Set assignedToId to SalesRep.id (not userId)
          createdAt,
          expectedCloseDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 12, 0, 0),
        },
      })
      currentMonthDeals.push(deal)
      if (i === 0 || i === 14) {
        console.log(`  ✓ Created current month deal ${i + 1}: ${deal.id}`)
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to create current month deal ${i + 1}:`, err?.message || err)
      console.error(`  Error details:`, {
        error: err?.message,
        code: err?.code,
        meta: err?.meta,
        tenantId,
        contactId: contact?.id,
        createdAt: createdAt.toISOString(),
      })
    }
  }
  console.log(`  ✓ Created ${currentMonthDeals.length} deals in current month`)
  
  // Verify deals were created with correct dates
  if (currentMonthDeals.length > 0) {
    const verifyDeal = await client.deal.findUnique({
      where: { id: currentMonthDeals[0].id },
      select: { id: true, name: true, createdAt: true },
    })
    console.log(`  ✓ Verified first deal: ${verifyDeal?.name} created at ${verifyDeal?.createdAt?.toISOString()}`)
  }
  
  // Final verification - count current month data
  const [finalCurrentMonthContacts, finalCurrentMonthDeals] = await Promise.all([
    client.contact.count({
      where: {
        tenantId,
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    }),
    client.deal.count({
      where: {
        tenantId,
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    }),
  ])
  
  // 6. LEAD SOURCES - Create lead sources and calculate statistics
  console.log(`  📊 Creating lead sources...`)
  const allContactsForSources = await client.contact.findMany({
    where: { tenantId },
    select: { id: true, source: true, stage: true },
  })
  
  const allDealsForSources = await client.deal.findMany({
    where: { tenantId },
    select: { id: true, value: true, stage: true, contactId: true },
  })
  
  // Get unique source types from contacts
  const uniqueSources = Array.from(new Set(
    allContactsForSources
      .map(c => c.source)
      .filter((s): s is string => s !== null && s !== undefined)
  ))
  
  // Define source types mapping
  const sourceTypeMap: Record<string, string> = {
    'Website': 'online',
    'LinkedIn': 'social',
    'Facebook': 'social',
    'Google Ads': 'paid',
    'Referral': 'referral',
    'Event': 'event',
    'Email': 'email',
    'Cold Call': 'outbound',
    'Partner': 'partner',
    'Trade Show': 'event',
    'Webinar': 'online',
    'Content Marketing': 'content',
  }
  
  const leadSources = []
  for (const sourceName of uniqueSources) {
    if (!sourceName) continue
    
    // Count leads (all contacts with this source)
    const leadsCount = allContactsForSources.filter(c => c.source === sourceName).length
    
    // Count conversions (contacts with stage='customer' and this source)
    const conversionsCount = allContactsForSources.filter(
      c => c.source === sourceName && c.stage === 'customer'
    ).length
    
    // Get contact IDs with this source
    const contactIdsWithSource = allContactsForSources
      .filter(c => c.source === sourceName)
      .map(c => c.id)
    
    // Calculate total value from deals linked to contacts with this source
    const dealsForSource = allDealsForSources.filter(
      d => contactIdsWithSource.includes(d.contactId) && d.stage === 'won'
    )
    const totalValue = dealsForSource.reduce((sum, d) => sum + (d.value || 0), 0)
    const avgDealValue = dealsForSource.length > 0 ? totalValue / dealsForSource.length : 0
    
    // Calculate conversion rate
    const conversionRate = leadsCount > 0 ? (conversionsCount / leadsCount) * 100 : 0
    
    // Determine source type
    const type = sourceTypeMap[sourceName] || 'other'
    
    try {
      // Check if lead source already exists
      let leadSource = await client.leadSource.findFirst({
        where: {
          tenantId,
          name: sourceName,
        },
      })
      
      if (leadSource) {
        // Update existing lead source
        leadSource = await client.leadSource.update({
          where: { id: leadSource.id },
          data: {
            leadsCount,
            conversionsCount,
            totalValue,
            avgDealValue,
            conversionRate,
            type,
          },
        })
      } else {
        // Create new lead source
        leadSource = await client.leadSource.create({
          data: {
            tenantId,
            name: sourceName,
            type,
            leadsCount,
            conversionsCount,
            totalValue,
            avgDealValue,
            conversionRate,
            roi: 0, // ROI calculation can be added later if needed
          },
        })
      }
      
      leadSources.push(leadSource)
      
      // Link contacts with this source to the LeadSource record
      try {
        await client.contact.updateMany({
          where: {
            tenantId,
            source: sourceName,
            sourceId: null, // Only update contacts that don't already have a sourceId
          },
          data: {
            sourceId: leadSource.id,
          },
        })
      } catch (linkError: any) {
        console.warn(`  ⚠️  Failed to link contacts to lead source ${sourceName}:`, linkError?.message || linkError)
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to create/update lead source ${sourceName}:`, error?.message || error)
    }
  }
  
  // Also create additional lead sources that might not have contacts yet (for variety)
  const additionalSources = [
    { name: 'Email Campaign', type: 'email' },
    { name: 'Cold Call', type: 'outbound' },
    { name: 'Partner Referral', type: 'partner' },
    { name: 'Trade Show', type: 'event' },
    { name: 'Webinar', type: 'online' },
    { name: 'Content Marketing', type: 'content' },
    { name: 'YouTube', type: 'social' },
    { name: 'Twitter/X', type: 'social' },
    { name: 'Instagram', type: 'social' },
    { name: 'Bing Ads', type: 'paid' },
  ]
  
  for (const source of additionalSources) {
    // Only create if it doesn't exist
    const exists = await client.leadSource.findFirst({
      where: {
        tenantId,
        name: source.name,
      },
    })
    
    if (!exists) {
      try {
        const newSource = await client.leadSource.create({
          data: {
            tenantId,
            name: source.name,
            type: source.type,
            leadsCount: 0,
            conversionsCount: 0,
            totalValue: 0,
            avgDealValue: 0,
            conversionRate: 0,
            roi: 0,
          },
        })
        leadSources.push(newSource)
      } catch (error: any) {
        // Silently continue - source might already exist
      }
    }
  }
  
  console.log(`  ✓ Created/updated ${leadSources.length} lead sources`)
  console.log(`  ✅ Final verification: ${finalCurrentMonthContacts} contacts, ${finalCurrentMonthDeals} deals in current month`)
  
  // Final summary with error reporting
  const totalDeals = deals.length + currentMonthDeals.length
  const expectedDeals = 200 + 15 // 200 historical + 15 current month
  
  // CRITICAL: Final verification - check actual database count
  let finalActualDealCount = 0
  try {
    finalActualDealCount = await client.deal.count({ where: { tenantId } })
    console.log(`  🔍 Final verification: ${finalActualDealCount} deals in database (reported: ${totalDeals})`)
    
    if (finalActualDealCount === 0 && dealData.length > 0) {
      console.error(`  ❌ CRITICAL: Seed completed but 0 deals exist in database!`)
      console.error(`  ❌ This is a critical failure - deals were not persisted`)
      throw new Error(`Seed failed: 0 deals created despite ${dealData.length} attempts. Check database connection and constraints.`)
    }
    
    if (finalActualDealCount < expectedDeals * 0.5) { // If less than 50% of expected deals
      console.warn(`  ⚠️  WARNING: Only ${finalActualDealCount} deals in database, expected ~${expectedDeals}`)
      console.warn(`  ⚠️  This may indicate database connection issues or constraint violations`)
      console.warn(`  ⚠️  Deal errors during creation: ${dealErrors}`)
    }
  } catch (finalError: any) {
    if (finalError?.message?.includes('Seed failed')) {
      throw finalError // Re-throw critical errors
    }
    console.error(`  ❌ Error in final verification:`, finalError?.message || String(finalError))
  }
  
  return {
    contacts: contacts.length + currentMonthContacts.length,
    deals: finalActualDealCount > 0 ? finalActualDealCount : totalDeals, // Use actual count if available
    tasks: tasks.length,
    activities: activityFeeds.filter(Boolean).length,
    notes: 0, // Not using notes model
    meetings: meetings.filter(Boolean).length,
  }
}
