/**
 * CRM Module Seeder for Demo Business
 * Seeds: Contacts, Deals, Tasks, Activities, Notes, Meetings
 * Date Range: March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, distributeAcrossMonths, getMonthsInRange } from './date-utils'

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
  const contacts = []
  const batchSize = 5 // Very small batch size to avoid connection pool exhaustion
  for (let i = 0; i < contactDates.length; i += batchSize) {
    const batch = contactDates.slice(i, i + batchSize)
    const batchResults = await Promise.all(
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
            createdAt: date,
            lastContactedAt: idx % 5 === 0 ? randomDateInRange({ start: date, end: range.end }) : null,
          },
        })
      })
    )
    contacts.push(...batchResults)
    // Longer delay between batches to allow connection pool to recover
    if (i + batchSize < contactDates.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${contacts.length} contacts`)

  // 2. DEALS - 200 deals across 12 months with various stages
  const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  const dealData = Array.from({ length: 200 }, (_, i) => {
    const stage = dealStages[Math.floor(Math.random() * dealStages.length)]
    const contact = contacts[Math.floor(Math.random() * contacts.length)]
    const createdAt = randomDateInRange(range)
    
    // Won deals should have actualCloseDate
    // Lost deals should have lostReason
    const isWon = stage === 'won'
    const isLost = stage === 'lost'
    const actualCloseDate = isWon ? randomDateInRange({ start: createdAt, end: range.end }) : null
    const expectedCloseDate = !isWon && !isLost ? randomDateInRange({ start: createdAt, end: range.end }) : null
    
    return {
      tenantId, // Add tenantId
      name: `Deal ${i + 1} - ${contact.company}`,
      value: Math.floor(Math.random() * 500000) + 10000,
      stage,
      probability: isWon ? 100 : isLost ? 0 : Math.floor(Math.random() * 80) + 20,
      contactId: contact.id,
      createdAt,
      expectedCloseDate,
      actualCloseDate,
      lostReason: isLost ? ['Budget constraints', 'Chose competitor', 'Timeline mismatch', 'No longer needed'][Math.floor(Math.random() * 4)] : null,
    }
  })

  // Create deals in batches
  const deals = []
  const dealBatchSize = 5
  for (let i = 0; i < dealData.length; i += dealBatchSize) {
    const batch = dealData.slice(i, i + dealBatchSize)
    const batchResults = await Promise.all(
      batch.map((deal) => client.deal.create({ data: deal }))
    )
    deals.push(...batchResults)
    if (i + dealBatchSize < dealData.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${deals.length} deals`)

  // 3. TASKS - 300 tasks distributed across 12 months
  const taskData = Array.from({ length: 300 }, (_, i) => {
    const contact = contacts[Math.floor(Math.random() * contacts.length)]
    const createdAt = randomDateInRange(range)
    const dueDate = randomDateInRange({ start: createdAt, end: range.end })
    const status = Math.random() > 0.3 ? 'pending' : Math.random() > 0.5 ? 'in_progress' : 'completed'
    const completedAt = status === 'completed' ? randomDateInRange({ start: dueDate, end: range.end }) : null
    
    return {
      title: `Task ${i + 1}: ${['Follow up', 'Prepare proposal', 'Schedule meeting', 'Send quote', 'Review contract'][i % 5]}`,
      description: `Task description for ${contact.name}`,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      status,
      dueDate,
      completedAt,
      contactId: contact.id,
      assignedToId: userId,
      tenantId,
      createdAt,
    }
  })

  // Create tasks in batches
  const tasks = []
  const taskBatchSize = 5
  for (let i = 0; i < taskData.length; i += taskBatchSize) {
    const batch = taskData.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((task) => client.task.create({ data: task }))
    )
    tasks.push(...batchResults)
    if (i + taskBatchSize < taskData.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${tasks.length} tasks`)

  // 4. ACTIVITY FEED - 500 activity feed entries (created after tasks)
  const activityTypes = ['create', 'update', 'comment', 'delete']
  const entityTypes = ['deal', 'contact', 'task']
  
  const activityFeedData = Array.from({ length: 500 }, (_, i) => {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)]
    const createdAt = randomDateInRange(range)
    
    let entityId: string
    if (entityType === 'deal') {
      entityId = deals[Math.floor(Math.random() * deals.length)].id
    } else if (entityType === 'contact') {
      entityId = contacts[Math.floor(Math.random() * contacts.length)].id
    } else {
      // entityType === 'task'
      entityId = tasks[Math.floor(Math.random() * tasks.length)].id
    }
    
    return {
      tenantId,
      type,
      entityType,
      entityId,
      userId,
      description: `${type} ${entityType}`,
      metadata: {},
      createdAt,
    }
  })

  // Create activity feeds in batches
  const activityFeeds = []
  const activityBatchSize = 5
  for (let i = 0; i < activityFeedData.length; i += activityBatchSize) {
    const batch = activityFeedData.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((activity) =>
        client.activityFeed.create({ data: activity }).catch(() => null)
      )
    )
    activityFeeds.push(...batchResults)
    if (i + activityBatchSize < activityFeedData.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${activityFeeds.filter(Boolean).length} activity feed entries`)

  // 5. MEETINGS - 100 meetings across 12 months (in batches)
  const meetings = []
  const meetingData = Array.from({ length: 100 }, (_, i) => {
    const startTime = randomDateInRange(range)
    return {
      tenantId,
      title: `Meeting ${i + 1}`,
      description: `Meeting discussion`,
      meetingCode: `MEET-${String(i + 1).padStart(8, '0')}-${Date.now()}-${i}`,
      startTime,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
      status: startTime > new Date() ? 'scheduled' : 'ended',
      hostId: userId,
      createdById: userId,
      createdAt: startTime,
    }
  })
  
  const meetingBatchSize = 5
  for (let i = 0; i < meetingData.length; i += meetingBatchSize) {
    const batch = meetingData.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((data) => client.meeting.create({ data }).catch(() => null))
    )
    meetings.push(...batchResults)
    if (i + meetingBatchSize < meetingData.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log(`  ✓ Created ${meetings.filter(Boolean).length} meetings`)

  return {
    contacts: contacts.length,
    deals: deals.length,
    tasks: tasks.length,
    activities: activityFeeds.filter(Boolean).length,
    notes: 0, // Not using notes model
    meetings: meetings.filter(Boolean).length,
  }
}
