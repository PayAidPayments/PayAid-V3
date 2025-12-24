import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCampaigns() {
  console.log('📧 Seeding demo campaigns with analytics data...')

  // Get the demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found. Please run the main seed script first.')
    process.exit(1)
  }

  // Get some contacts for the campaigns
  const contacts = await prisma.contact.findMany({
    where: { tenantId: tenant.id },
    take: 50,
  })

  const contactIds = contacts.map(c => c.id)

  if (contactIds.length === 0) {
    console.log('⚠️  No contacts found. Creating campaigns with empty contact lists.')
  }

  // Demo campaigns with realistic analytics
  const demoCampaigns = [
    // Email Campaigns
    {
      name: 'Welcome Email Campaign',
      type: 'email',
      subject: 'Welcome to Our Platform!',
      content: 'Thank you for joining us! We\'re excited to have you on board. Explore our features and get started today.',
      status: 'sent',
      recipientCount: contactIds.length || 25,
      sent: contactIds.length || 25,
      delivered: Math.floor((contactIds.length || 25) * 0.96), // 96% delivery rate
      opened: Math.floor((contactIds.length || 25) * 0.96 * 0.42), // 42% open rate
      clicked: Math.floor((contactIds.length || 25) * 0.96 * 0.42 * 0.18), // 18% click rate
      bounced: Math.floor((contactIds.length || 25) * 0.04), // 4% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      name: 'Product Launch Announcement',
      type: 'email',
      subject: 'Introducing Our New Product Line',
      content: 'We\'re thrilled to announce our latest product line! Check out the amazing features and special launch pricing.',
      status: 'sent',
      recipientCount: contactIds.length || 30,
      sent: contactIds.length || 30,
      delivered: Math.floor((contactIds.length || 30) * 0.94), // 94% delivery rate
      opened: Math.floor((contactIds.length || 30) * 0.94 * 0.38), // 38% open rate
      clicked: Math.floor((contactIds.length || 30) * 0.94 * 0.38 * 0.22), // 22% click rate
      bounced: Math.floor((contactIds.length || 30) * 0.06), // 6% bounce rate
      unsubscribed: 1,
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      name: 'Monthly Newsletter - December',
      type: 'email',
      subject: 'December Newsletter: Year-End Highlights',
      content: 'As we wrap up the year, here are the highlights from December and what to expect in the new year.',
      status: 'sent',
      recipientCount: contactIds.length || 45,
      sent: contactIds.length || 45,
      delivered: Math.floor((contactIds.length || 45) * 0.97), // 97% delivery rate
      opened: Math.floor((contactIds.length || 45) * 0.97 * 0.35), // 35% open rate
      clicked: Math.floor((contactIds.length || 45) * 0.97 * 0.35 * 0.15), // 15% click rate
      bounced: Math.floor((contactIds.length || 45) * 0.03), // 3% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      name: 'Holiday Sale Promotion',
      type: 'email',
      subject: '🎉 Holiday Sale: Up to 50% Off!',
      content: 'Don\'t miss our biggest sale of the year! Get up to 50% off on all products. Limited time offer!',
      status: 'sent',
      recipientCount: contactIds.length || 40,
      sent: contactIds.length || 40,
      delivered: Math.floor((contactIds.length || 40) * 0.95), // 95% delivery rate
      opened: Math.floor((contactIds.length || 40) * 0.95 * 0.48), // 48% open rate (high for sales)
      clicked: Math.floor((contactIds.length || 40) * 0.95 * 0.48 * 0.28), // 28% click rate
      bounced: Math.floor((contactIds.length || 40) * 0.05), // 5% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      name: 'Customer Feedback Request',
      type: 'email',
      subject: 'We\'d Love Your Feedback',
      content: 'Your opinion matters! Please take a moment to share your experience with us.',
      status: 'sent',
      recipientCount: contactIds.length || 20,
      sent: contactIds.length || 20,
      delivered: Math.floor((contactIds.length || 20) * 0.98), // 98% delivery rate
      opened: Math.floor((contactIds.length || 20) * 0.98 * 0.28), // 28% open rate
      clicked: Math.floor((contactIds.length || 20) * 0.98 * 0.28 * 0.12), // 12% click rate
      bounced: Math.floor((contactIds.length || 20) * 0.02), // 2% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    // WhatsApp Campaigns
    {
      name: 'WhatsApp Product Update',
      type: 'whatsapp',
      subject: null,
      content: 'Hi! We\'ve just launched new features. Check them out: [link]',
      status: 'sent',
      recipientCount: contactIds.length || 35,
      sent: contactIds.length || 35,
      delivered: Math.floor((contactIds.length || 35) * 0.99), // 99% delivery rate (WhatsApp is reliable)
      opened: Math.floor((contactIds.length || 35) * 0.99 * 0.85), // 85% open rate (WhatsApp has high open rates)
      clicked: Math.floor((contactIds.length || 35) * 0.99 * 0.85 * 0.25), // 25% click rate
      bounced: Math.floor((contactIds.length || 35) * 0.01), // 1% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
      name: 'WhatsApp Order Confirmation',
      type: 'whatsapp',
      subject: null,
      content: 'Your order #12345 has been confirmed! Track your shipment: [link]',
      status: 'sent',
      recipientCount: contactIds.length || 15,
      sent: contactIds.length || 15,
      delivered: Math.floor((contactIds.length || 15) * 0.98), // 98% delivery rate
      opened: Math.floor((contactIds.length || 15) * 0.98 * 0.92), // 92% open rate (transactional messages)
      clicked: Math.floor((contactIds.length || 15) * 0.98 * 0.92 * 0.35), // 35% click rate
      bounced: Math.floor((contactIds.length || 15) * 0.02), // 2% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    },
    // SMS Campaigns
    {
      name: 'SMS Flash Sale Alert',
      type: 'sms',
      subject: null,
      content: 'Flash Sale! 30% off today only. Use code FLASH30. Shop now: [link]',
      status: 'sent',
      recipientCount: contactIds.length || 50,
      sent: contactIds.length || 50,
      delivered: Math.floor((contactIds.length || 50) * 0.97), // 97% delivery rate
      opened: 0, // SMS doesn't track opens
      clicked: Math.floor((contactIds.length || 50) * 0.97 * 0.12), // 12% click rate
      bounced: Math.floor((contactIds.length || 50) * 0.03), // 3% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      name: 'SMS Appointment Reminder',
      type: 'sms',
      subject: null,
      content: 'Reminder: Your appointment is scheduled for tomorrow at 2 PM. Reply CONFIRM to confirm.',
      status: 'sent',
      recipientCount: contactIds.length || 12,
      sent: contactIds.length || 12,
      delivered: Math.floor((contactIds.length || 12) * 0.96), // 96% delivery rate
      opened: 0, // SMS doesn't track opens
      clicked: Math.floor((contactIds.length || 12) * 0.96 * 0.08), // 8% click rate
      bounced: Math.floor((contactIds.length || 12) * 0.04), // 4% bounce rate
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    },
    // Scheduled Campaigns
    {
      name: 'New Year Special Offer',
      type: 'email',
      subject: 'Start the New Year with Special Savings',
      content: 'Happy New Year! Start 2025 with our special New Year offer. Get 25% off on all plans.',
      status: 'scheduled',
      recipientCount: contactIds.length || 60,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      scheduledFor: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    },
    // Draft Campaigns
    {
      name: 'Q1 Product Roadmap',
      type: 'email',
      subject: 'What\'s Coming in Q1 2025',
      content: 'We\'re excited to share our Q1 roadmap with you. Here\'s what to expect in the coming months.',
      status: 'draft',
      recipientCount: contactIds.length || 55,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      scheduledFor: null,
    },
  ]

  // Delete existing campaigns for the tenant
  await prisma.campaign.deleteMany({
    where: { tenantId: tenant.id },
  })

  console.log(`🗑️  Deleted existing campaigns for tenant: ${tenant.name}`)

  // Create demo campaigns
  for (const campaignData of demoCampaigns) {
    const campaign = await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: campaignData.name,
        type: campaignData.type,
        subject: campaignData.subject,
        content: campaignData.content,
        status: campaignData.status,
        contactIds: contactIds.length > 0 ? contactIds.slice(0, campaignData.recipientCount) : [],
        recipientCount: campaignData.recipientCount,
        sent: campaignData.sent,
        delivered: campaignData.delivered,
        opened: campaignData.opened,
        clicked: campaignData.clicked,
        bounced: campaignData.bounced,
        unsubscribed: campaignData.unsubscribed,
        sentAt: campaignData.sentAt || null,
        scheduledFor: campaignData.scheduledFor || null,
      },
    })
    console.log(`✅ Created campaign: ${campaign.name} (${campaign.type}) - Status: ${campaign.status}`)
  }

  console.log(`\n✨ Successfully created ${demoCampaigns.length} demo campaigns!`)
  console.log(`📊 Campaign breakdown:`)
  console.log(`   - Email: ${demoCampaigns.filter(c => c.type === 'email').length}`)
  console.log(`   - WhatsApp: ${demoCampaigns.filter(c => c.type === 'whatsapp').length}`)
  console.log(`   - SMS: ${demoCampaigns.filter(c => c.type === 'sms').length}`)
  console.log(`   - Sent: ${demoCampaigns.filter(c => c.status === 'sent').length}`)
  console.log(`   - Scheduled: ${demoCampaigns.filter(c => c.status === 'scheduled').length}`)
  console.log(`   - Draft: ${demoCampaigns.filter(c => c.status === 'draft').length}`)
}

seedCampaigns()
  .catch((e) => {
    console.error('❌ Error seeding campaigns:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
