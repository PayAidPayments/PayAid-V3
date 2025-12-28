import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Comprehensive Sample Data Seeder
 * Adds realistic sample data for all features and modules
 */
async function seedAllSampleData() {
  console.log('🌱 Starting comprehensive sample data seeding...\n')

  // Get the demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found. Please run the main seed script first.')
    process.exit(1)
  }

  const tenantId = tenant.id
  console.log(`✅ Found tenant: ${tenant.name} (${tenantId})\n`)

  // Get existing contacts for relationships
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    take: 50,
  })
  const contactIds = contacts.map((c) => c.id)

  // Get existing products
  const products = await prisma.product.findMany({
    where: { tenantId },
    take: 20,
  })

  // Get existing deals
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    take: 20,
  })

  console.log('📧 Seeding Email Templates...')
  await seedEmailTemplates(tenantId)
  console.log('✅ Email Templates seeded\n')

  console.log('📱 Seeding Social Media Posts...')
  await seedSocialMediaPosts(tenantId)
  console.log('✅ Social Media Posts seeded\n')

  console.log('📬 Seeding Email Messages...')
  await seedEmailMessages(tenantId)
  console.log('✅ Email Messages seeded\n')

  console.log('📢 Seeding Enhanced Campaigns...')
  await seedEnhancedCampaigns(tenantId, contactIds)
  console.log('✅ Enhanced Campaigns seeded\n')

  console.log('💼 Seeding Additional Deals...')
  await seedAdditionalDeals(tenantId, contactIds)
  console.log('✅ Additional Deals seeded\n')

  console.log('✅ Seeding Tasks...')
  await seedTasks(tenantId, contactIds)
  console.log('✅ Tasks seeded\n')

  console.log('📦 Seeding Additional Products...')
  await seedAdditionalProducts(tenantId)
  console.log('✅ Additional Products seeded\n')

  console.log('🧾 Seeding Additional Invoices...')
  await seedAdditionalInvoices(tenantId, contacts, products)
  console.log('✅ Additional Invoices seeded\n')

  console.log('🛒 Seeding Additional Orders...')
  await seedAdditionalOrders(tenantId, contacts, products)
  console.log('✅ Additional Orders seeded\n')

  console.log('📊 Seeding Segments...')
  await seedSegments(tenantId, contactIds)
  console.log('✅ Segments seeded\n')

  console.log('🎯 Seeding Lead Sources...')
  await seedLeadSources(tenantId)
  console.log('✅ Lead Sources seeded\n')

  console.log('📧 Seeding Nurture Templates...')
  await seedNurtureTemplates(tenantId)
  console.log('✅ Nurture Templates seeded\n')

  console.log('📅 Seeding Scheduled Emails...')
  await seedScheduledEmails(tenantId, contactIds)
  console.log('✅ Scheduled Emails seeded\n')

  console.log('💬 Seeding Interactions...')
  await seedInteractions(tenantId, contactIds)
  console.log('✅ Interactions seeded\n')

  console.log('🌐 Seeding Websites & Analytics...')
  await seedWebsites(tenantId)
  console.log('✅ Websites & Analytics seeded\n')

  console.log('📄 Seeding Landing Pages...')
  await seedLandingPages(tenantId)
  console.log('✅ Landing Pages seeded\n')

  console.log('💳 Seeding Checkout Pages...')
  await seedCheckoutPages(tenantId)
  console.log('✅ Checkout Pages seeded\n')

  console.log('🎉 Seeding Events...')
  await seedEvents(tenantId, contactIds)
  console.log('✅ Events seeded\n')

  console.log('📞 Seeding AI Calls...')
  await seedAICalls(tenantId, contactIds)
  console.log('✅ AI Calls seeded\n')

  console.log('🎨 Seeding Logos...')
  await seedLogos(tenantId)
  console.log('✅ Logos seeded\n')

  console.log('🤖 Seeding Website Chatbots...')
  await seedWebsiteChatbots(tenantId, contactIds)
  console.log('✅ Website Chatbots seeded\n')

  console.log('📊 Seeding Custom Dashboards...')
  await seedCustomDashboards(tenantId)
  console.log('✅ Custom Dashboards seeded\n')

  console.log('📈 Seeding Custom Reports...')
  await seedCustomReports(tenantId)
  console.log('✅ Custom Reports seeded\n')

  console.log('📱 Seeding WhatsApp Data...')
  await seedWhatsAppData(tenantId, contactIds)
  console.log('✅ WhatsApp Data seeded\n')

  console.log('📧 Seeding Webmail (Email Accounts & Folders)...')
  await seedWebmail(tenantId)
  console.log('✅ Webmail seeded\n')

  console.log('💬 Seeding Team Chat...')
  await seedTeamChat(tenantId)
  console.log('✅ Team Chat seeded\n')

  console.log('👥 Seeding HR Employees...')
  await seedHREmployees(tenantId)
  console.log('✅ HR Employees seeded\n')

  console.log('💰 Seeding Payroll...')
  await seedPayroll(tenantId)
  console.log('✅ Payroll seeded\n')

  console.log('🎯 Seeding Hiring (Job Postings & Candidates)...')
  await seedHiring(tenantId)
  console.log('✅ Hiring seeded\n')

  console.log('📊 Seeding GST Reports...')
  await seedGSTReports(tenantId)
  console.log('✅ GST Reports seeded\n')

  console.log('\n✨ All sample data seeded successfully!')
  console.log('\n📊 Complete Summary:')
  console.log(`   - Email Templates: 8`)
  console.log(`   - Social Media Posts: 12`)
  console.log(`   - Email Messages: 15`)
  console.log(`   - Campaigns: 15`)
  console.log(`   - Deals: 10`)
  console.log(`   - Tasks: 15`)
  console.log(`   - Products: 10`)
  console.log(`   - Invoices: 8`)
  console.log(`   - Orders: 8`)
  console.log(`   - Segments: 5`)
  console.log(`   - Lead Sources: 8`)
  console.log(`   - Nurture Templates: 3`)
  console.log(`   - Scheduled Emails: 10`)
  console.log(`   - Interactions: 20`)
  console.log(`   - Websites: 3`)
  console.log(`   - Landing Pages: 5`)
  console.log(`   - Checkout Pages: 3`)
  console.log(`   - Events: 5`)
  console.log(`   - AI Calls: 8`)
  console.log(`   - Logos: 5`)
  console.log(`   - Website Chatbots: 3`)
  console.log(`   - Custom Dashboards: 4`)
  console.log(`   - Custom Reports: 5`)
  console.log(`   - WhatsApp Conversations: 5`)
  console.log(`   - Email Accounts: 2`)
  console.log(`   - Email Folders: 12`)
  console.log(`   - Email Messages: 6`)
  console.log(`   - Chat Workspace: 1`)
  console.log(`   - Chat Channels: 3`)
  console.log(`   - Chat Messages: 6`)
  console.log(`   - HR Employees: 3`)
  console.log(`   - Payroll Runs: 3`)
  console.log(`   - Job Postings: 1`)
  console.log(`   - Candidates: 2`)
  console.log(`   - GST Reports: 3`)
}

// Email Templates
async function seedEmailTemplates(tenantId: string) {
  const templates = [
    {
      name: 'Welcome Email',
      category: 'onboarding',
      subject: 'Welcome to {{companyName}}!',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Welcome, {{contactName}}!</h1>
    <p>Thank you for joining {{companyName}}. We're excited to have you on board!</p>
    <p>Here's what you can expect:</p>
    <ul>
      <li>Access to all our premium features</li>
      <li>24/7 customer support</li>
      <li>Regular updates and new features</li>
    </ul>
    <p>If you have any questions, feel free to reach out to us.</p>
    <p>Best regards,<br>The {{companyName}} Team</p>
  </div>
</body>
</html>`,
      textContent: 'Welcome, {{contactName}}! Thank you for joining {{companyName}}. We\'re excited to have you on board!',
      variables: ['contactName', 'companyName'],
      timesUsed: 45,
      lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Invoice Reminder',
      category: 'billing',
      subject: 'Reminder: Invoice #{{invoiceNumber}} is Due',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">Payment Reminder</h2>
    <p>Dear {{contactName}},</p>
    <p>This is a friendly reminder that invoice <strong>#{{invoiceNumber}}</strong> for <strong>₹{{amount}}</strong> is due on {{dueDate}}.</p>
    <p>You can view and pay your invoice by clicking the link below:</p>
    <p><a href="{{invoiceLink}}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>
    <p>If you've already made the payment, please disregard this email.</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>`,
      textContent: 'Dear {{contactName}}, This is a reminder that invoice #{{invoiceNumber}} for ₹{{amount}} is due on {{dueDate}}. View invoice: {{invoiceLink}}',
      variables: ['contactName', 'invoiceNumber', 'amount', 'dueDate', 'invoiceLink'],
      timesUsed: 120,
      lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Event Invitation',
      category: 'marketing',
      subject: 'You\'re Invited: {{eventName}}',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">You're Invited!</h1>
    <p>Dear {{contactName}},</p>
    <p>We're excited to invite you to <strong>{{eventName}}</strong>!</p>
    <p><strong>Date:</strong> {{eventDate}}<br>
    <strong>Time:</strong> {{eventTime}}<br>
    <strong>Location:</strong> {{eventLocation}}</p>
    <p>{{eventDescription}}</p>
    <p><a href="{{eventLink}}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">RSVP Now</a></p>
    <p>We hope to see you there!</p>
  </div>
</body>
</html>`,
      textContent: 'Dear {{contactName}}, You\'re invited to {{eventName}} on {{eventDate}} at {{eventTime}}. Location: {{eventLocation}}. {{eventDescription}} RSVP: {{eventLink}}',
      variables: ['contactName', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'eventDescription', 'eventLink'],
      timesUsed: 30,
      lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Deal Follow-up',
      category: 'sales',
      subject: 'Following up on {{dealName}}',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <p>Hi {{contactName}},</p>
    <p>I wanted to follow up on our discussion about <strong>{{dealName}}</strong> (Value: ₹{{dealValue}}).</p>
    <p>I'm here to answer any questions you might have and help move this forward.</p>
    <p>Would you be available for a quick call this week to discuss next steps?</p>
    <p>Best regards,<br>{{salesRepName}}</p>
  </div>
</body>
</html>`,
      textContent: 'Hi {{contactName}}, I wanted to follow up on {{dealName}} (Value: ₹{{dealValue}}). Would you be available for a call this week? Best regards, {{salesRepName}}',
      variables: ['contactName', 'dealName', 'dealValue', 'salesRepName'],
      timesUsed: 85,
      lastUsedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Product Launch Announcement',
      category: 'marketing',
      subject: 'Introducing {{productName}} - Now Available!',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">🎉 New Product Launch!</h1>
    <p>Hi {{contactName}},</p>
    <p>We're thrilled to announce the launch of <strong>{{productName}}</strong>!</p>
    <p>{{productDescription}}</p>
    <p><strong>Key Features:</strong></p>
    <ul>
      <li>{{feature1}}</li>
      <li>{{feature2}}</li>
      <li>{{feature3}}</li>
    </ul>
    <p>Get it now for just <strong>₹{{price}}</strong>!</p>
    <p><a href="{{productLink}}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Learn More</a></p>
  </div>
</body>
</html>`,
      textContent: 'Hi {{contactName}}, We\'re thrilled to announce {{productName}}! {{productDescription}} Features: {{feature1}}, {{feature2}}, {{feature3}}. Get it now for ₹{{price}}! Learn more: {{productLink}}',
      variables: ['contactName', 'productName', 'productDescription', 'feature1', 'feature2', 'feature3', 'price', 'productLink'],
      timesUsed: 25,
      lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Order Confirmation',
      category: 'transactional',
      subject: 'Order Confirmation - #{{orderNumber}}',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #16a34a;">Order Confirmed!</h2>
    <p>Dear {{contactName}},</p>
    <p>Thank you for your order! Your order <strong>#{{orderNumber}}</strong> has been confirmed.</p>
    <p><strong>Order Total:</strong> ₹{{orderTotal}}</p>
    <p><strong>Items:</strong></p>
    <ul>{{orderItems}}</ul>
    <p>We'll send you a shipping confirmation once your order is on its way.</p>
    <p><a href="{{orderLink}}">Track Your Order</a></p>
  </div>
</body>
</html>`,
      textContent: 'Dear {{contactName}}, Your order #{{orderNumber}} has been confirmed. Total: ₹{{orderTotal}}. Items: {{orderItems}}. Track: {{orderLink}}',
      variables: ['contactName', 'orderNumber', 'orderTotal', 'orderItems', 'orderLink'],
      timesUsed: 150,
      lastUsedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      name: 'Thank You Note',
      category: 'customer-service',
      subject: 'Thank You for Your Business!',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">Thank You!</h2>
    <p>Dear {{contactName}},</p>
    <p>We wanted to take a moment to thank you for choosing {{companyName}}.</p>
    <p>Your support means the world to us, and we're committed to providing you with the best service possible.</p>
    <p>If there's anything we can do to improve your experience, please don't hesitate to reach out.</p>
    <p>Warm regards,<br>The {{companyName}} Team</p>
  </div>
</body>
</html>`,
      textContent: 'Dear {{contactName}}, We wanted to thank you for choosing {{companyName}}. Your support means the world to us!',
      variables: ['contactName', 'companyName'],
      timesUsed: 60,
      lastUsedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Newsletter Template',
      category: 'marketing',
      subject: '{{newsletterTitle}} - {{month}} Newsletter',
      htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">{{newsletterTitle}}</h1>
    <p>Hi {{contactName}},</p>
    <p>Here's what's new this {{month}}:</p>
    <h3>{{section1Title}}</h3>
    <p>{{section1Content}}</p>
    <h3>{{section2Title}}</h3>
    <p>{{section2Content}}</p>
    <h3>{{section3Title}}</h3>
    <p>{{section3Content}}</p>
    <p>Thanks for reading!</p>
  </div>
</body>
</html>`,
      textContent: 'Hi {{contactName}}, Here\'s what\'s new this {{month}}: {{section1Title}}: {{section1Content}}. {{section2Title}}: {{section2Content}}. {{section3Title}}: {{section3Content}}.',
      variables: ['contactName', 'newsletterTitle', 'month', 'section1Title', 'section1Content', 'section2Title', 'section2Content', 'section3Title', 'section3Content'],
      timesUsed: 12,
      lastUsedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ]

  // Delete existing templates
  await prisma.emailTemplate.deleteMany({ where: { tenantId } })

  for (const template of templates) {
    await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: template.name,
        category: template.category,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || null,
        variables: template.variables ? template.variables : undefined,
        timesUsed: template.timesUsed || 0,
        lastUsedAt: template.lastUsedAt || null,
        isActive: true,
        isDefault: false,
      },
    })
  }
}

// Social Media Posts
async function seedSocialMediaPosts(tenantId: string) {
  // Get or create social media accounts
  let facebookAccount = await prisma.socialMediaAccount.findFirst({
    where: { tenantId, platform: 'facebook' },
  })
  let linkedinAccount = await prisma.socialMediaAccount.findFirst({
    where: { tenantId, platform: 'linkedin' },
  })
  let twitterAccount = await prisma.socialMediaAccount.findFirst({
    where: { tenantId, platform: 'twitter' },
  })
  let instagramAccount = await prisma.socialMediaAccount.findFirst({
    where: { tenantId, platform: 'instagram' },
  })

  if (!facebookAccount) {
    facebookAccount = await prisma.socialMediaAccount.create({
      data: {
        tenantId,
        platform: 'facebook',
        accountName: 'Demo Business Page',
        accountId: 'demo-facebook-page',
        followerCount: 1250,
        isConnected: true,
        accessToken: 'demo-facebook-access-token-encrypted',
      },
    })
  }

  if (!linkedinAccount) {
    linkedinAccount = await prisma.socialMediaAccount.create({
      data: {
        tenantId,
        platform: 'linkedin',
        accountName: 'Demo Business Company Page',
        accountId: 'demo-linkedin-page',
        followerCount: 850,
        isConnected: true,
        accessToken: 'demo-linkedin-access-token-encrypted',
      },
    })
  }

  if (!twitterAccount) {
    twitterAccount = await prisma.socialMediaAccount.create({
      data: {
        tenantId,
        platform: 'twitter',
        accountName: '@demobusiness',
        accountId: 'demo-twitter-account',
        followerCount: 3200,
        isConnected: true,
        accessToken: 'demo-twitter-access-token-encrypted',
      },
    })
  }

  if (!instagramAccount) {
    instagramAccount = await prisma.socialMediaAccount.create({
      data: {
        tenantId,
        platform: 'instagram',
        accountName: '@demobusiness',
        accountId: 'demo-instagram-account',
        followerCount: 2100,
        isConnected: true,
        accessToken: 'demo-instagram-access-token-encrypted',
      },
    })
  }

  const posts = [
    // Facebook Posts
    {
      accountId: facebookAccount.id,
      platform: 'facebook',
      content: '🎉 Exciting news! We just launched our new product line with amazing features. Check it out and let us know what you think! #NewProduct #Innovation',
      mediaUrls: ['https://via.placeholder.com/800x600?text=Product+Launch'],
      status: 'published',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      engagement: 145,
      reach: 1200,
      impressions: 1850,
      likes: 98,
      comments: 12,
      shares: 35,
    },
    {
      accountId: facebookAccount.id,
      platform: 'facebook',
      content: 'Thank you to all our customers for an amazing year! We appreciate your support and look forward to serving you in 2025. 🙏',
      mediaUrls: [],
      status: 'published',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      engagement: 89,
      reach: 980,
      impressions: 1450,
      likes: 67,
      comments: 15,
      shares: 7,
    },
    {
      accountId: facebookAccount.id,
      platform: 'facebook',
      content: 'Flash Sale Alert! 🛍️ Get 30% off on all products today only. Use code FLASH30 at checkout. Limited time offer!',
      mediaUrls: ['https://via.placeholder.com/800x600?text=Flash+Sale'],
      status: 'published',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      engagement: 234,
      reach: 2100,
      impressions: 3200,
      likes: 156,
      comments: 28,
      shares: 50,
    },
    {
      accountId: facebookAccount.id,
      platform: 'facebook',
      content: 'Behind the scenes: Our team working hard to bring you the best products and services. Meet the people behind the magic! ✨',
      mediaUrls: [],
      status: 'DRAFT',
      publishedAt: null,
      engagement: 0,
      reach: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    },
    // LinkedIn Posts
    {
      accountId: linkedinAccount.id,
      platform: 'linkedin',
      content: 'We\'re excited to share insights from our latest industry research. Key findings show that businesses using our platform see 40% growth in the first quarter. Read the full report: [link] #BusinessGrowth #IndustryInsights',
      mediaUrls: [],
      status: 'published',
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      engagement: 78,
      reach: 720,
      impressions: 1100,
      likes: 45,
      comments: 18,
      shares: 15,
    },
    {
      accountId: linkedinAccount.id,
      platform: 'linkedin',
      content: 'We\'re hiring! Join our growing team and help shape the future of business technology. Open positions in Engineering, Sales, and Marketing. Apply now: [link] #Hiring #TechJobs',
      mediaUrls: [],
      status: 'published',
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      engagement: 156,
      reach: 1400,
      impressions: 2100,
      likes: 89,
      comments: 42,
      shares: 25,
    },
    {
      accountId: linkedinAccount.id,
      platform: 'linkedin',
      content: 'Case Study: How Company XYZ increased their revenue by 60% using our platform. Learn about their journey and best practices. #CaseStudy #SuccessStory',
      mediaUrls: ['https://via.placeholder.com/1200x630?text=Case+Study'],
      status: 'published',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      engagement: 92,
      reach: 850,
      impressions: 1300,
      likes: 56,
      comments: 21,
      shares: 15,
    },
    // Twitter/X Posts
    {
      accountId: twitterAccount.id,
      platform: 'twitter',
      content: '🚀 Just hit 10,000 customers! Thank you to everyone who has been part of our journey. Here\'s to the next 10K! #Milestone #ThankYou',
      mediaUrls: [],
      status: 'published',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      engagement: 320,
      reach: 2800,
      impressions: 4500,
      likes: 245,
      comments: 45,
      shares: 30,
    },
    {
      accountId: twitterAccount.id,
      platform: 'twitter',
      content: 'Quick tip: Automate your workflows to save 10+ hours per week. Our latest feature makes it easier than ever. Try it free: [link] #Productivity #Automation',
      mediaUrls: [],
      status: 'published',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      engagement: 189,
      reach: 1650,
      impressions: 2800,
      likes: 134,
      comments: 28,
      shares: 27,
    },
    {
      accountId: twitterAccount.id,
      platform: 'twitter',
      content: 'What\'s your biggest business challenge? We\'re here to help! Drop a comment and let\'s discuss solutions. 💬 #BusinessTips #Community',
      mediaUrls: [],
      status: 'published',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      engagement: 156,
      reach: 1400,
      impressions: 2200,
      likes: 98,
      comments: 38,
      shares: 20,
    },
    // Instagram Posts
    {
      accountId: instagramAccount.id,
      platform: 'instagram',
      content: '✨ New product launch! Swipe to see all the amazing features. Available now! Link in bio 🔗 #NewProduct #Launch #Innovation',
      mediaUrls: ['https://via.placeholder.com/1080x1080?text=Product+Photo'],
      status: 'published',
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      engagement: 456,
      reach: 3800,
      impressions: 5200,
      likes: 389,
      comments: 45,
      shares: 22,
    },
    {
      accountId: instagramAccount.id,
      platform: 'instagram',
      content: 'Team spotlight! Meet our amazing team members who make everything possible. Tag someone who inspires you! 👥 #TeamWork #CompanyCulture',
      mediaUrls: ['https://via.placeholder.com/1080x1080?text=Team+Photo'],
      status: 'published',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      engagement: 289,
      reach: 2400,
      impressions: 3600,
      likes: 234,
      comments: 32,
      shares: 23,
    },
  ]

  // Delete existing posts
  await prisma.socialPost.deleteMany({ where: { account: { tenantId } } })

  for (const post of posts) {
    await prisma.socialPost.create({
      data: {
        ...post,
        tenantId,
        imageUrl: Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null,
      },
    })
  }

  // Create scheduled posts
  const scheduledPosts = [
    {
      accountId: facebookAccount.id,
      platform: 'facebook',
      content: 'New Year, New Goals! Set yourself up for success in 2025 with our planning tools. Start your free trial today!',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    },
    {
      accountId: linkedinAccount.id,
      platform: 'linkedin',
      content: 'Join us for our monthly webinar: "Scaling Your Business in 2025". Register now: [link] #Webinar #BusinessGrowth',
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    },
    {
      accountId: twitterAccount.id,
      platform: 'twitter',
      content: 'Feature Friday: Discover how our analytics dashboard helps you make data-driven decisions. Try it free! #FeatureFriday #Analytics',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    },
  ]

  await prisma.scheduledPost.deleteMany({ where: { account: { tenantId } } })

  for (const post of scheduledPosts) {
    await prisma.scheduledPost.create({
      data: {
        ...post,
        tenantId,
      },
    })
  }
}

// Email Messages
async function seedEmailMessages(tenantId: string) {
  const emailAccounts = await prisma.emailAccount.findMany({
    where: { tenantId },
    take: 2,
  })

  if (emailAccounts.length === 0) {
    console.log('⚠️  No email accounts found, skipping email messages')
    return
  }

  const inboxFolder = await prisma.emailFolder.findFirst({
    where: {
      accountId: emailAccounts[0].id,
      type: 'inbox',
    },
  })

  if (!inboxFolder) {
    console.log('⚠️  No inbox folder found, skipping email messages')
    return
  }

  const messages = [
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-1@payaid.io>`,
      fromEmail: 'customer@example.com',
      fromName: 'John Customer',
      toEmails: [emailAccounts[0].email],
      subject: 'Inquiry about your services',
      body: 'Hello,\n\nI am interested in learning more about your services. Can you please provide more information?\n\nBest regards,\nJohn Customer',
      htmlBody: '<p>Hello,</p><p>I am interested in learning more about your services. Can you please provide more information?</p><p>Best regards,<br>John Customer</p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-2@payaid.io>`,
      fromEmail: 'partner@company.com',
      fromName: 'Sarah Partner',
      toEmails: [emailAccounts[0].email],
      subject: 'Partnership opportunity',
      body: 'Hi there,\n\nWe would like to discuss a potential partnership. Are you available for a call this week?\n\nThanks,\nSarah',
      htmlBody: '<p>Hi there,</p><p>We would like to discuss a potential partnership. Are you available for a call this week?</p><p>Thanks,<br>Sarah</p>',
      isRead: true,
      isStarred: true,
      receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-3@payaid.io>`,
      fromEmail: 'support@vendor.com',
      fromName: 'Support Team',
      toEmails: [emailAccounts[0].email],
      subject: 'Your order has been shipped',
      body: 'Your order #12345 has been shipped and will arrive within 3-5 business days.\n\nTracking number: TRACK123456',
      htmlBody: '<p>Your order #12345 has been shipped and will arrive within 3-5 business days.</p><p>Tracking number: <strong>TRACK123456</strong></p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-4@payaid.io>`,
      fromEmail: 'newsletter@industry.com',
      fromName: 'Industry Newsletter',
      toEmails: [emailAccounts[0].email],
      subject: 'Weekly Industry Updates - December 2024',
      body: 'This week in industry news:\n\n1. New regulations announced\n2. Market trends analysis\n3. Upcoming events\n\nRead more: [link]',
      htmlBody: '<h2>Weekly Industry Updates</h2><p>This week in industry news:</p><ol><li>New regulations announced</li><li>Market trends analysis</li><li>Upcoming events</li></ol><p><a href="#">Read more</a></p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-5@payaid.io>`,
      fromEmail: 'client@business.com',
      fromName: 'Michael Client',
      toEmails: [emailAccounts[0].email],
      subject: 'Proposal Review Request',
      body: 'Hi,\n\nI\'ve reviewed the proposal and have a few questions. Can we schedule a call to discuss?\n\nBest,\nMichael',
      htmlBody: '<p>Hi,</p><p>I\'ve reviewed the proposal and have a few questions. Can we schedule a call to discuss?</p><p>Best,<br>Michael</p>',
      isRead: true,
      receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-6@payaid.io>`,
      fromEmail: 'billing@service.com',
      fromName: 'Billing Department',
      toEmails: [emailAccounts[0].email],
      subject: 'Invoice #INV-2024-001 - Payment Received',
      body: 'Thank you for your payment of ₹25,000 for invoice #INV-2024-001.\n\nPayment received on: December 15, 2024\n\nThank you for your business!',
      htmlBody: '<p>Thank you for your payment of <strong>₹25,000</strong> for invoice #INV-2024-001.</p><p>Payment received on: <strong>December 15, 2024</strong></p><p>Thank you for your business!</p>',
      isRead: true,
      receivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-7@payaid.io>`,
      fromEmail: 'event@conference.com',
      fromName: 'Conference Organizers',
      toEmails: [emailAccounts[0].email],
      subject: 'You\'re Registered: Tech Conference 2025',
      body: 'Congratulations! You\'re successfully registered for Tech Conference 2025.\n\nDate: January 20-22, 2025\nLocation: Mumbai Convention Center\n\nSee you there!',
      htmlBody: '<h2>Registration Confirmed!</h2><p>Congratulations! You\'re successfully registered for <strong>Tech Conference 2025</strong>.</p><p><strong>Date:</strong> January 20-22, 2025<br><strong>Location:</strong> Mumbai Convention Center</p><p>See you there!</p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-8@payaid.io>`,
      fromEmail: 'support@platform.com',
      fromName: 'Platform Support',
      toEmails: [emailAccounts[0].email],
      subject: 'Account Security Alert',
      body: 'We noticed a new login to your account from a new device.\n\nIf this was you, no action is needed. If not, please secure your account immediately.',
      htmlBody: '<p><strong>Security Alert</strong></p><p>We noticed a new login to your account from a new device.</p><p>If this was you, no action is needed. If not, please <a href="#">secure your account</a> immediately.</p>',
      isRead: false,
      isStarred: true,
      receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-9@payaid.io>`,
      fromEmail: 'marketing@company.com',
      fromName: 'Marketing Team',
      toEmails: [emailAccounts[0].email],
      subject: 'Special Offer: 50% Off This Week Only!',
      body: 'Don\'t miss our biggest sale of the year! Get 50% off on all premium plans. Use code SAVE50 at checkout.\n\nOffer expires: December 31, 2024',
      htmlBody: '<h2>🎉 Special Offer: 50% Off!</h2><p>Don\'t miss our biggest sale of the year! Get 50% off on all premium plans.</p><p>Use code <strong>SAVE50</strong> at checkout.</p><p><em>Offer expires: December 31, 2024</em></p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-10@payaid.io>`,
      fromEmail: 'team@collaboration.com',
      fromName: 'Team Collaboration',
      toEmails: [emailAccounts[0].email],
      subject: 'Meeting Reminder: Q1 Planning Session',
      body: 'Reminder: You have a meeting scheduled for tomorrow at 2:00 PM.\n\nTopic: Q1 Planning Session\nLocation: Conference Room A',
      htmlBody: '<p><strong>Meeting Reminder</strong></p><p>You have a meeting scheduled for <strong>tomorrow at 2:00 PM</strong>.</p><p><strong>Topic:</strong> Q1 Planning Session<br><strong>Location:</strong> Conference Room A</p>',
      isRead: true,
      receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-11@payaid.io>`,
      fromEmail: 'feedback@survey.com',
      fromName: 'Customer Feedback',
      toEmails: [emailAccounts[0].email],
      subject: 'We\'d Love Your Feedback!',
      body: 'Hi there,\n\nWe value your opinion! Please take 2 minutes to share your experience with us.\n\nSurvey link: [link]\n\nThank you!',
      htmlBody: '<p>Hi there,</p><p>We value your opinion! Please take 2 minutes to share your experience with us.</p><p><a href="#">Take Survey</a></p><p>Thank you!</p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-12@payaid.io>`,
      fromEmail: 'vendor@supplier.com',
      fromName: 'Supplier Relations',
      toEmails: [emailAccounts[0].email],
      subject: 'New Product Catalog Available',
      body: 'We\'re excited to share our new product catalog for 2025. Check out our latest offerings and special pricing.\n\nDownload catalog: [link]',
      htmlBody: '<p>We\'re excited to share our new product catalog for 2025. Check out our latest offerings and special pricing.</p><p><a href="#">Download Catalog</a></p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-13@payaid.io>`,
      fromEmail: 'hr@company.com',
      fromName: 'HR Department',
      toEmails: [emailAccounts[0].email],
      subject: 'Welcome to the Team!',
      body: 'Welcome aboard! We\'re thrilled to have you join our team.\n\nYour onboarding schedule and materials are attached. Please review before your first day.',
      htmlBody: '<h2>Welcome to the Team!</h2><p>We\'re thrilled to have you join our team.</p><p>Your onboarding schedule and materials are attached. Please review before your first day.</p>',
      isRead: true,
      receivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-14@payaid.io>`,
      fromEmail: 'finance@company.com',
      fromName: 'Finance Team',
      toEmails: [emailAccounts[0].email],
      subject: 'Expense Report Approved',
      body: 'Your expense report #EXP-2024-123 has been approved.\n\nTotal amount: ₹15,000\nPayment will be processed within 3-5 business days.',
      htmlBody: '<p>Your expense report <strong>#EXP-2024-123</strong> has been approved.</p><p><strong>Total amount:</strong> ₹15,000</p><p>Payment will be processed within 3-5 business days.</p>',
      isRead: true,
      receivedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccounts[0].id,
      folderId: inboxFolder.id,
      messageId: `<msg-${Date.now()}-15@payaid.io>`,
      fromEmail: 'noreply@system.com',
      fromName: 'System Notification',
      toEmails: [emailAccounts[0].email],
      subject: 'Backup Completed Successfully',
      body: 'Your system backup has been completed successfully.\n\nBackup date: December 19, 2024\nSize: 2.5 GB\nStatus: ✓ Complete',
      htmlBody: '<p><strong>Backup Completed Successfully</strong></p><p>Your system backup has been completed successfully.</p><p><strong>Backup date:</strong> December 19, 2024<br><strong>Size:</strong> 2.5 GB<br><strong>Status:</strong> ✓ Complete</p>',
      isRead: false,
      receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ]

  // Delete existing messages
  await prisma.emailMessage.deleteMany({
    where: { account: { tenantId } },
  })

  for (const message of messages) {
    await prisma.emailMessage.create({
      data: message,
    })
  }

  // Update folder counts
  await prisma.emailFolder.update({
    where: { id: inboxFolder.id },
    data: {
      unreadCount: messages.filter((m) => !m.isRead).length,
      totalCount: messages.length,
    },
  })
}

// Enhanced Campaigns
async function seedEnhancedCampaigns(tenantId: string, contactIds: string[]) {
  const campaigns = [
    {
      name: 'Welcome Email Campaign',
      type: 'email',
      subject: 'Welcome to Our Platform!',
      content: 'Thank you for joining us! We\'re excited to have you on board. Explore our features and get started today.',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 25),
      sent: Math.min(contactIds.length, 25),
      delivered: Math.floor(Math.min(contactIds.length, 25) * 0.96),
      opened: Math.floor(Math.min(contactIds.length, 25) * 0.96 * 0.42),
      clicked: Math.floor(Math.min(contactIds.length, 25) * 0.96 * 0.42 * 0.18),
      bounced: Math.floor(Math.min(contactIds.length, 25) * 0.04),
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Product Launch Announcement',
      type: 'email',
      subject: 'Introducing Our New Product Line',
      content: 'We\'re thrilled to announce our latest product line! Check out the amazing features and special launch pricing.',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 30),
      sent: Math.min(contactIds.length, 30),
      delivered: Math.floor(Math.min(contactIds.length, 30) * 0.94),
      opened: Math.floor(Math.min(contactIds.length, 30) * 0.94 * 0.38),
      clicked: Math.floor(Math.min(contactIds.length, 30) * 0.94 * 0.38 * 0.22),
      bounced: Math.floor(Math.min(contactIds.length, 30) * 0.06),
      unsubscribed: 1,
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Monthly Newsletter - December',
      type: 'email',
      subject: 'December Newsletter: Year-End Highlights',
      content: 'As we wrap up the year, here are the highlights from December and what to expect in the new year.',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 45),
      sent: Math.min(contactIds.length, 45),
      delivered: Math.floor(Math.min(contactIds.length, 45) * 0.97),
      opened: Math.floor(Math.min(contactIds.length, 45) * 0.97 * 0.35),
      clicked: Math.floor(Math.min(contactIds.length, 45) * 0.97 * 0.35 * 0.15),
      bounced: Math.floor(Math.min(contactIds.length, 45) * 0.03),
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Holiday Sale Promotion',
      type: 'email',
      subject: '🎉 Holiday Sale: Up to 50% Off!',
      content: 'Don\'t miss our biggest sale of the year! Get up to 50% off on all products. Limited time offer!',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 40),
      sent: Math.min(contactIds.length, 40),
      delivered: Math.floor(Math.min(contactIds.length, 40) * 0.95),
      opened: Math.floor(Math.min(contactIds.length, 40) * 0.95 * 0.48),
      clicked: Math.floor(Math.min(contactIds.length, 40) * 0.95 * 0.48 * 0.28),
      bounced: Math.floor(Math.min(contactIds.length, 40) * 0.05),
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Customer Feedback Request',
      type: 'email',
      subject: 'We\'d Love Your Feedback',
      content: 'Your opinion matters! Please take a moment to share your experience with us.',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 20),
      sent: Math.min(contactIds.length, 20),
      delivered: Math.floor(Math.min(contactIds.length, 20) * 0.98),
      opened: Math.floor(Math.min(contactIds.length, 20) * 0.98 * 0.28),
      clicked: Math.floor(Math.min(contactIds.length, 20) * 0.98 * 0.28 * 0.12),
      bounced: Math.floor(Math.min(contactIds.length, 20) * 0.02),
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'WhatsApp Product Update',
      type: 'whatsapp',
      subject: null,
      content: 'Hi! We\'ve just launched new features. Check them out: [link]',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 35),
      sent: Math.min(contactIds.length, 35),
      delivered: Math.floor(Math.min(contactIds.length, 35) * 0.99),
      opened: Math.floor(Math.min(contactIds.length, 35) * 0.99 * 0.85),
      clicked: Math.floor(Math.min(contactIds.length, 35) * 0.99 * 0.85 * 0.25),
      bounced: Math.floor(Math.min(contactIds.length, 35) * 0.01),
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'SMS Flash Sale Alert',
      type: 'sms',
      subject: null,
      content: 'Flash Sale! 30% off today only. Use code FLASH30. Shop now: [link]',
      status: 'sent',
      recipientCount: Math.min(contactIds.length, 50),
      sent: Math.min(contactIds.length, 50),
      delivered: Math.floor(Math.min(contactIds.length, 50) * 0.97),
      opened: 0,
      clicked: Math.floor(Math.min(contactIds.length, 50) * 0.97 * 0.12),
      bounced: Math.floor(Math.min(contactIds.length, 50) * 0.03),
      unsubscribed: 0,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'New Year Special Offer',
      type: 'email',
      subject: 'Start the New Year with Special Savings',
      content: 'Happy New Year! Start 2025 with our special New Year offer. Get 25% off on all plans.',
      status: 'scheduled',
      recipientCount: Math.min(contactIds.length, 60),
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      scheduledFor: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Q1 Product Roadmap',
      type: 'email',
      subject: 'What\'s Coming in Q1 2025',
      content: 'We\'re excited to share our Q1 roadmap with you. Here\'s what to expect in the coming months.',
      status: 'DRAFT',
      recipientCount: Math.min(contactIds.length, 55),
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      scheduledFor: null,
    },
  ]

  // Delete existing campaigns
  await prisma.campaign.deleteMany({ where: { tenantId } })

  for (const campaign of campaigns) {
    await prisma.campaign.create({
      data: {
        tenantId,
        ...campaign,
        contactIds: contactIds.length > 0 ? contactIds.slice(0, campaign.recipientCount) : [],
      },
    })
  }
}

// Additional Deals
async function seedAdditionalDeals(tenantId: string, contactIds: string[]) {
  if (contactIds.length === 0) return

  const deals = [
    {
      name: 'Enterprise Software License',
      value: 500000,
      probability: 75,
      stage: 'negotiation',
      contactId: contactIds[0],
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Annual Service Contract',
      value: 250000,
      probability: 60,
      stage: 'proposal',
      contactId: contactIds[1] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Custom Development Project',
      value: 750000,
      probability: 40,
      stage: 'qualified',
      contactId: contactIds[2] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Product Bundle Sale',
      value: 150000,
      probability: 85,
      stage: 'negotiation',
      contactId: contactIds[3] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Consulting Services',
      value: 300000,
      probability: 50,
      stage: 'proposal',
      contactId: contactIds[4] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Maintenance Agreement',
      value: 120000,
      probability: 90,
      stage: 'negotiation',
      contactId: contactIds[5] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Training Program',
      value: 80000,
      probability: 70,
      stage: 'qualified',
      contactId: contactIds[6] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Equipment Purchase',
      value: 400000,
      probability: 55,
      stage: 'proposal',
      contactId: contactIds[7] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Marketing Campaign',
      value: 200000,
      probability: 65,
      stage: 'qualified',
      contactId: contactIds[8] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Support Package',
      value: 100000,
      probability: 80,
      stage: 'negotiation',
      contactId: contactIds[9] || contactIds[0],
      expectedCloseDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const deal of deals) {
    await prisma.deal.create({
      data: {
        tenantId,
        ...deal,
      },
    })
  }
}

// Tasks
async function seedTasks(tenantId: string, contactIds: string[]) {
  const tasks = [
    {
      title: 'Follow up with client on proposal',
      description: 'Call to discuss the proposal details and answer any questions',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      contactId: contactIds[0] || null,
    },
    {
      title: 'Prepare quarterly report',
      description: 'Compile sales data and create quarterly performance report',
      priority: 'medium',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Review contract terms',
      description: 'Review and finalize contract terms for new deal',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      contactId: contactIds[1] || null,
    },
    {
      title: 'Update product catalog',
      description: 'Add new products and update pricing information',
      priority: 'low',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Schedule team meeting',
      description: 'Organize monthly team meeting and send invitations',
      priority: 'medium',
      status: 'completed',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Send invoice reminders',
      description: 'Follow up on overdue invoices and send payment reminders',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      contactId: contactIds[2] || null,
    },
    {
      title: 'Prepare presentation for client',
      description: 'Create presentation deck for upcoming client meeting',
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      contactId: contactIds[3] || null,
    },
    {
      title: 'Update website content',
      description: 'Refresh homepage content and add new testimonials',
      priority: 'low',
      status: 'pending',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Conduct customer satisfaction survey',
      description: 'Send survey to recent customers and analyze results',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Renew vendor contracts',
      description: 'Review and renew contracts with key vendors',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Train new team member',
      description: 'Onboard new team member and provide training',
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Review marketing campaign performance',
      description: 'Analyze campaign metrics and prepare optimization recommendations',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Update pricing strategy',
      description: 'Review competitor pricing and adjust our pricing model',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Organize team building event',
      description: 'Plan and organize quarterly team building activity',
      priority: 'low',
      status: 'pending',
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
    {
      title: 'Complete compliance audit',
      description: 'Review compliance requirements and complete audit checklist',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      contactId: null,
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        tenantId,
        ...task,
      },
    })
  }
}

// Additional Products
async function seedAdditionalProducts(tenantId: string) {
  const products = [
    {
      name: 'Premium Software License',
      description: 'Full-featured software license with 24/7 support',
      category: 'Software',
      purchasePrice: 50000,
      salePrice: 75000,
      stock: 100,
      sku: 'PROD-SW-001',
    },
    {
      name: 'Professional Services Package',
      description: 'Comprehensive professional services including consultation and implementation',
      category: 'Services',
      purchasePrice: 0,
      salePrice: 150000,
      stock: 999,
      sku: 'PROD-SVC-001',
    },
    {
      name: 'Training Program - Basic',
      description: 'Basic training program for new users',
      category: 'Training',
      purchasePrice: 5000,
      salePrice: 15000,
      stock: 50,
      sku: 'PROD-TRN-001',
    },
    {
      name: 'Training Program - Advanced',
      description: 'Advanced training program for power users',
      category: 'Training',
      purchasePrice: 10000,
      salePrice: 30000,
      stock: 30,
      sku: 'PROD-TRN-002',
    },
    {
      name: 'Annual Maintenance Contract',
      description: 'Annual maintenance and support contract',
      category: 'Services',
      purchasePrice: 0,
      salePrice: 50000,
      stock: 999,
      sku: 'PROD-AMC-001',
    },
    {
      name: 'Custom Development',
      description: 'Custom software development services',
      category: 'Services',
      purchasePrice: 0,
      salePrice: 200000,
      stock: 999,
      sku: 'PROD-DEV-001',
    },
    {
      name: 'Cloud Hosting - Starter',
      description: 'Starter cloud hosting package with basic features',
      category: 'Hosting',
      purchasePrice: 2000,
      salePrice: 5000,
      stock: 999,
      sku: 'PROD-HST-001',
    },
    {
      name: 'Cloud Hosting - Professional',
      description: 'Professional cloud hosting with advanced features',
      category: 'Hosting',
      purchasePrice: 5000,
      salePrice: 15000,
      stock: 999,
      sku: 'PROD-HST-002',
    },
    {
      name: 'API Access - Basic',
      description: 'Basic API access with limited requests',
      category: 'API',
      purchasePrice: 0,
      salePrice: 10000,
      stock: 999,
      sku: 'PROD-API-001',
    },
    {
      name: 'API Access - Enterprise',
      description: 'Enterprise API access with unlimited requests',
      category: 'API',
      purchasePrice: 0,
      salePrice: 50000,
      stock: 999,
      sku: 'PROD-API-002',
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: {
        tenantId,
        name: product.name,
        description: product.description,
        sku: product.sku,
        costPrice: product.purchasePrice || 0,
        salePrice: product.salePrice,
        quantity: product.stock || 0,
        categories: product.category ? [product.category] : [],
        images: [],
      },
    })
  }
}

// Additional Invoices
async function seedAdditionalInvoices(tenantId: string, contacts: any[], products: any[]) {
  if (contacts.length === 0 || products.length === 0) return

  const customerContacts = contacts.filter((c) => c.type === 'customer').slice(0, 8)
  if (customerContacts.length === 0) return

  // Get tenant for invoice number generation
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })
  if (!tenant) return

  // Get existing invoice count
  const existingCount = await prisma.invoice.count({
    where: { tenantId },
  })

  const invoices = []
  for (let i = 0; i < Math.min(8, customerContacts.length); i++) {
    const customer = customerContacts[i]
    const invoiceDate = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
    const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    const items = [
      {
        description: products[i % products.length]?.name || 'Product/Service',
        quantity: Math.floor(Math.random() * 5) + 1,
        rate: products[i % products.length]?.salePrice || 10000,
        category: 'standard',
        gstRate: 18,
      },
    ]

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
    const gstAmount = (subtotal * 18) / 100
    const total = subtotal + gstAmount

    const statuses: ('draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')[] = [
      'draft',
      'sent',
      'paid',
      'overdue',
    ]
    const status = statuses[i % statuses.length]

    // Generate invoice number
    const invoiceNumber = `INV-${tenant.name.substring(0, 3).toUpperCase()}-${String(existingCount + i + 1).padStart(5, '0')}`

    invoices.push({
      invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerCity: customer.city,
      customerState: customer.state,
      customerPostalCode: customer.postalCode,
      customerGSTIN: customer.gstin || undefined,
      invoiceDate,
      dueDate,
      status,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        category: item.category,
        gstRate: item.gstRate,
      })),
      subtotal,
      totalGst: gstAmount,
      total,
      notes: i % 2 === 0 ? 'Thank you for your business!' : undefined,
      terms: i % 3 === 0 ? 'Payment due within 30 days' : undefined,
    })
  }

  for (const invoice of invoices) {
    await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        subtotal: invoice.subtotal,
        tax: invoice.totalGst,
        total: invoice.total,
        gstRate: 18,
        gstAmount: invoice.totalGst,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
      },
    })
  }
}

// Additional Orders
async function seedAdditionalOrders(tenantId: string, contacts: any[], products: any[]) {
  if (contacts.length === 0 || products.length === 0) return

  const customerContacts = contacts.filter((c) => c.type === 'customer').slice(0, 8)
  if (customerContacts.length === 0) return

  // Get existing order count for order number generation
  const existingCount = await prisma.order.count({
    where: { tenantId },
  })

  const orders = []
  for (let i = 0; i < Math.min(8, customerContacts.length); i++) {
    const customer = customerContacts[i]
    const orderDate = new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000)

    const items = [
      {
        productId: products[i % products.length]?.id,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: products[i % products.length]?.salePrice || 10000,
      },
    ]

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const gstAmount = (subtotal * 18) / 100
    const shipping = 0
    const total = subtotal + gstAmount + shipping

    const statuses: ('pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded')[] = [
      'pending',
      'confirmed',
      'shipped',
      'delivered',
    ]
    const status = statuses[i % statuses.length]

    // Generate order number
    const orderNumber = `ORD-${String(existingCount + i + 1).padStart(6, '0')}`

    orders.push({
      orderNumber,
      customerId: customer.id,
      status,
      subtotal,
      tax: gstAmount,
      shipping,
      total,
      shippingAddress: customer.address || 'N/A',
      shippingCity: customer.city || 'N/A',
      shippingPostal: customer.postalCode || 'N/A',
      shippingCountry: 'India',
      items: items.map((item) => ({
        productId: item.productId,
        productName: products[i % products.length]?.name || 'Product',
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
    })
  }

  for (const order of orders) {
    await prisma.order.create({
      data: {
        tenantId,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingPostal: order.shippingPostal,
        shippingCountry: order.shippingCountry,
        items: {
          create: order.items,
        },
      },
    })
  }
}

// Segments
async function seedSegments(tenantId: string, contactIds: string[]) {
  const segments = [
    {
      name: 'High-Value Customers',
      description: 'Customers with total purchase value above ₹1,00,000',
      criteria: JSON.stringify({
        type: 'customer',
        minTotalValue: 100000,
      }),
    },
    {
      name: 'Recent Leads',
      description: 'Leads created in the last 30 days',
      criteria: JSON.stringify({
        type: 'lead',
        createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    },
    {
      name: 'Active Deals',
      description: 'Contacts with active deals in pipeline',
      criteria: JSON.stringify({
        hasActiveDeals: true,
      }),
    },
    {
      name: 'Email Subscribers',
      description: 'Contacts who have subscribed to email communications',
      criteria: JSON.stringify({
        subscribedToEmail: true,
      }),
    },
    {
      name: 'Overdue Invoices',
      description: 'Customers with overdue invoices',
      criteria: JSON.stringify({
        type: 'customer',
        hasOverdueInvoices: true,
      }),
    },
  ]

  // Delete existing segments
  await prisma.segment.deleteMany({ where: { tenantId } })

  for (const segment of segments) {
    await prisma.segment.create({
      data: {
        tenantId,
        name: segment.name,
        description: segment.description,
        criteria: segment.criteria,
        criteriaConfig: segment.criteria,
      },
    })
  }
}

// Lead Sources
async function seedLeadSources(tenantId: string) {
  const leadSources = [
    {
      name: 'Google Search',
      type: 'organic',
      leadsCount: 125,
      conversionsCount: 25,
      totalValue: 2500000,
      avgDealValue: 100000,
      conversionRate: 20.0,
      roi: 0,
    },
    {
      name: 'Facebook Ad Campaign A',
      type: 'paid_ad',
      leadsCount: 80,
      conversionsCount: 12,
      totalValue: 1200000,
      avgDealValue: 100000,
      conversionRate: 15.0,
      roi: 180.0,
    },
    {
      name: 'LinkedIn',
      type: 'social',
      leadsCount: 45,
      conversionsCount: 10,
      totalValue: 1500000,
      avgDealValue: 150000,
      conversionRate: 22.2,
      roi: 0,
    },
    {
      name: 'Referral Program',
      type: 'referral',
      leadsCount: 30,
      conversionsCount: 18,
      totalValue: 1800000,
      avgDealValue: 100000,
      conversionRate: 60.0,
      roi: 0,
    },
    {
      name: 'Direct Website Visit',
      type: 'direct',
      leadsCount: 60,
      conversionsCount: 15,
      totalValue: 900000,
      avgDealValue: 60000,
      conversionRate: 25.0,
      roi: 0,
    },
    {
      name: 'Email Campaign',
      type: 'email',
      leadsCount: 100,
      conversionsCount: 20,
      totalValue: 2000000,
      avgDealValue: 100000,
      conversionRate: 20.0,
      roi: 250.0,
    },
    {
      name: 'Trade Show 2024',
      type: 'event',
      leadsCount: 50,
      conversionsCount: 8,
      totalValue: 800000,
      avgDealValue: 100000,
      conversionRate: 16.0,
      roi: 120.0,
    },
    {
      name: 'Content Marketing',
      type: 'organic',
      leadsCount: 70,
      conversionsCount: 14,
      totalValue: 1400000,
      avgDealValue: 100000,
      conversionRate: 20.0,
      roi: 0,
    },
  ]

  // Delete existing lead sources
  await prisma.leadSource.deleteMany({ where: { tenantId } })

  for (const source of leadSources) {
    await prisma.leadSource.create({
      data: {
        tenantId,
        ...source,
      },
    })
  }
}

// Nurture Templates
async function seedNurtureTemplates(tenantId: string) {
  // Delete existing templates and their steps
  await prisma.nurtureStep.deleteMany({
    where: { template: { tenantId } },
  })
  await prisma.nurtureTemplate.deleteMany({ where: { tenantId } })

  const templates = [
    {
      name: 'Cold Lead Nurture',
      description: '5-step email sequence for cold leads',
      steps: [
        {
          dayNumber: 0,
          channel: 'email',
          subject: 'Welcome! Let\'s Get Started',
          body: 'Hi {{contactName}},\n\nThanks for your interest! We\'d love to help you achieve your goals.\n\nHere\'s what we offer...',
          order: 1,
        },
        {
          dayNumber: 3,
          channel: 'email',
          subject: 'How We Can Help',
          body: 'Hi {{contactName}},\n\nI wanted to share how we\'ve helped businesses like yours succeed...',
          order: 2,
        },
        {
          dayNumber: 7,
          channel: 'email',
          subject: 'Success Stories',
          body: 'Hi {{contactName}},\n\nCheck out these success stories from our customers...',
          order: 3,
        },
        {
          dayNumber: 10,
          channel: 'email',
          subject: 'Special Offer Just for You',
          body: 'Hi {{contactName}},\n\nAs a thank you for your interest, here\'s a special offer...',
          order: 4,
        },
        {
          dayNumber: 14,
          channel: 'email',
          subject: 'Let\'s Talk',
          body: 'Hi {{contactName}},\n\nWould you be open to a quick 15-minute call to discuss your needs?',
          order: 5,
        },
      ],
    },
    {
      name: 'Warm Lead Follow-up',
      description: '3-step follow-up sequence for warm leads',
      steps: [
        {
          dayNumber: 0,
          channel: 'email',
          subject: 'Thank You for Your Interest',
          body: 'Hi {{contactName}},\n\nThank you for taking the time to speak with us. As discussed...',
          order: 1,
        },
        {
          dayNumber: 5,
          channel: 'email',
          subject: 'Additional Resources',
          body: 'Hi {{contactName}},\n\nI thought you might find these resources helpful...',
          order: 2,
        },
        {
          dayNumber: 10,
          channel: 'email',
          subject: 'Ready to Move Forward?',
          body: 'Hi {{contactName}},\n\nI wanted to check in and see if you\'re ready to move forward...',
          order: 3,
        },
      ],
    },
    {
      name: 'Re-engagement Campaign',
      description: '4-step sequence to re-engage inactive contacts',
      steps: [
        {
          dayNumber: 0,
          channel: 'email',
          subject: 'We Miss You!',
          body: 'Hi {{contactName}},\n\nWe haven\'t heard from you in a while. We\'d love to reconnect...',
          order: 1,
        },
        {
          dayNumber: 7,
          channel: 'email',
          subject: 'What\'s New',
          body: 'Hi {{contactName}},\n\nA lot has changed since we last connected. Here\'s what\'s new...',
          order: 2,
        },
        {
          dayNumber: 14,
          channel: 'email',
          subject: 'Special Re-engagement Offer',
          body: 'Hi {{contactName}},\n\nWe\'d love to welcome you back with a special offer...',
          order: 3,
        },
        {
          dayNumber: 21,
          channel: 'email',
          subject: 'Last Chance',
          body: 'Hi {{contactName}},\n\nThis is our final attempt to reconnect. We\'d love to hear from you!',
          order: 4,
        },
      ],
    },
  ]

  for (const templateData of templates) {
    const template = await prisma.nurtureTemplate.create({
      data: {
        tenantId,
        name: templateData.name,
        description: templateData.description,
      },
    })

    for (const stepData of templateData.steps) {
      await prisma.nurtureStep.create({
        data: {
          templateId: template.id,
          ...stepData,
        },
      })
    }
  }
}

// Scheduled Emails
async function seedScheduledEmails(tenantId: string, contactIds: string[]) {
  if (contactIds.length === 0) return

  const scheduledEmails = []
  for (let i = 0; i < Math.min(10, contactIds.length); i++) {
    scheduledEmails.push({
      contactId: contactIds[i],
      channel: 'email',
      subject: i % 2 === 0 ? 'Follow-up: Your Inquiry' : 'Special Offer for You',
      body:
        i % 2 === 0
          ? 'Hi,\n\nI wanted to follow up on your recent inquiry. Let me know if you have any questions!'
          : 'Hi,\n\nWe have a special offer that might interest you. Check it out!',
      scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    })
  }

  // Delete existing scheduled emails
  await prisma.scheduledEmail.deleteMany({ where: { tenantId } })

  for (const email of scheduledEmails) {
    await prisma.scheduledEmail.create({
      data: {
        tenantId,
        ...email,
      },
    })
  }
}

// Interactions
async function seedInteractions(tenantId: string, contactIds: string[]) {
  if (contactIds.length === 0) return

  const interactions = [
    {
      contactId: contactIds[0],
      type: 'email',
      subject: 'Product Inquiry',
      notes: 'Customer inquired about premium features. Sent detailed product information.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[0],
      type: 'call',
      subject: 'Follow-up Call',
      notes: 'Discussed pricing and implementation timeline. Very interested.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[1] || contactIds[0],
      type: 'meeting',
      subject: 'Product Demo',
      notes: 'Conducted product demo. Customer was impressed with features.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[1] || contactIds[0],
      type: 'email',
      subject: 'Proposal Sent',
      notes: 'Sent detailed proposal with pricing and terms.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[2] || contactIds[0],
      type: 'call',
      subject: 'Support Call',
      notes: 'Helped customer resolve technical issue. Issue resolved successfully.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[2] || contactIds[0],
      type: 'email',
      subject: 'Invoice Sent',
      notes: 'Sent invoice #INV-2024-001 for services rendered.',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[3] || contactIds[0],
      type: 'meeting',
      subject: 'Contract Review',
      notes: 'Reviewed contract terms and conditions. Customer has questions about payment terms.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[3] || contactIds[0],
      type: 'email',
      subject: 'Contract Updated',
      notes: 'Sent updated contract with revised payment terms.',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[4] || contactIds[0],
      type: 'call',
      subject: 'Onboarding Call',
      notes: 'Conducted onboarding call. Explained platform features and setup process.',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[4] || contactIds[0],
      type: 'email',
      subject: 'Welcome Package',
      notes: 'Sent welcome package with documentation and resources.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[5] || contactIds[0],
      type: 'meeting',
      subject: 'Quarterly Review',
      notes: 'Conducted quarterly business review. Discussed growth opportunities.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[5] || contactIds[0],
      type: 'email',
      subject: 'Renewal Reminder',
      notes: 'Sent renewal reminder for annual subscription.',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[6] || contactIds[0],
      type: 'call',
      subject: 'Technical Support',
      notes: 'Provided technical support for API integration issues.',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[6] || contactIds[0],
      type: 'email',
      subject: 'Issue Resolved',
      notes: 'Confirmed that technical issue has been resolved.',
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[7] || contactIds[0],
      type: 'meeting',
      subject: 'Strategy Session',
      notes: 'Discussed marketing strategy and campaign planning.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[7] || contactIds[0],
      type: 'email',
      subject: 'Campaign Proposal',
      notes: 'Sent marketing campaign proposal with budget and timeline.',
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[8] || contactIds[0],
      type: 'call',
      subject: 'Sales Call',
      notes: 'Initial sales call. Customer showed strong interest in enterprise plan.',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[8] || contactIds[0],
      type: 'email',
      subject: 'Enterprise Plan Details',
      notes: 'Sent detailed information about enterprise plan features and pricing.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[9] || contactIds[0],
      type: 'meeting',
      subject: 'Training Session',
      notes: 'Conducted training session on advanced features.',
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[9] || contactIds[0],
      type: 'email',
      subject: 'Training Materials',
      notes: 'Sent training materials and video recordings.',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ]

  // Delete existing interactions
  await prisma.interaction.deleteMany({ where: { contact: { tenantId } } })

  for (const interaction of interactions) {
    await prisma.interaction.create({
      data: {
        contactId: interaction.contactId,
        type: interaction.type,
        subject: interaction.subject,
        notes: interaction.notes,
        createdAt: interaction.createdAt,
      },
    })
  }
}

// Websites & Analytics
async function seedWebsites(tenantId: string) {
  const websites = [
    {
      name: 'Demo Business Main Website',
      domain: 'demobusiness.com',
      subdomain: 'demo-main',
      status: 'PUBLISHED',
      trackingCode: `PAY-${tenantId.substring(0, 8).toUpperCase()}-MAIN`,
    },
    {
      name: 'Product Landing Site',
      domain: null,
      subdomain: 'products',
      status: 'PUBLISHED',
      trackingCode: `PAY-${tenantId.substring(0, 8).toUpperCase()}-PROD`,
    },
    {
      name: 'Marketing Campaign Site',
      domain: null,
      subdomain: 'campaign',
      status: 'DRAFT',
      trackingCode: `PAY-${tenantId.substring(0, 8).toUpperCase()}-CAMP`,
    },
  ]

  // Delete existing websites and related data
  await prisma.websitePage.deleteMany({ where: { website: { tenantId } } })
  await prisma.websiteVisit.deleteMany({ where: { website: { tenantId } } })
  await prisma.websiteSession.deleteMany({ where: { website: { tenantId } } })
  await prisma.websiteEvent.deleteMany({ where: { website: { tenantId } } })
  await prisma.website.deleteMany({ where: { tenantId } })

  const createdWebsites = []
  for (const websiteData of websites) {
    const website = await prisma.website.create({
      data: {
        tenantId,
        name: websiteData.name,
        domain: websiteData.domain,
        subdomain: websiteData.subdomain,
        status: websiteData.status,
        trackingCode: websiteData.trackingCode,
      },
    })
    createdWebsites.push(website)

    // Create pages for each website
    const pages = [
      { title: 'Home', path: '/', isPublished: true },
      { title: 'About', path: '/about', isPublished: true },
      { title: 'Products', path: '/products', isPublished: true },
      { title: 'Contact', path: '/contact', isPublished: true },
    ]

    for (const pageData of pages) {
      const page = await prisma.websitePage.create({
        data: {
          websiteId: website.id,
          title: pageData.title,
          path: pageData.path,
          isPublished: pageData.isPublished,
          contentJson: {
            type: 'page',
            sections: [
              {
                type: 'hero',
                title: pageData.title,
                subtitle: `Welcome to ${pageData.title} page`,
              },
            ],
          },
        },
      })

      // Create some visits for published pages
      if (page.isPublished && website.status === 'PUBLISHED') {
        for (let i = 0; i < 10; i++) {
          await prisma.websiteVisit.create({
            data: {
              websiteId: website.id,
              pageId: page.id,
              tenantId,
              device: ['desktop', 'mobile', 'tablet'][i % 3],
              browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][i % 4],
              os: ['Windows', 'macOS', 'iOS', 'Android'][i % 4],
              referrer: i % 2 === 0 ? 'google.com' : 'direct',
              visitedAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
            },
          })
        }
      }
    }
  }
}

// Landing Pages
async function seedLandingPages(tenantId: string) {
  const landingPages = [
    {
      name: 'Product Launch 2024',
      slug: 'product-launch-2024',
      status: 'PUBLISHED',
      views: 1250,
      conversions: 45,
      conversionRate: 3.6,
      contentJson: {
        type: 'landing-page',
        sections: [
          {
            type: 'hero',
            title: 'Introducing Our Revolutionary Product',
            subtitle: 'Transform your business with cutting-edge technology',
            cta: { text: 'Get Started Now', link: '/contact' },
            backgroundImage: 'https://placehold.co/1920x1080/2563eb/ffffff?text=Product+Launch+2024',
          },
          {
            type: 'features',
            title: 'Key Features',
            items: [
              {
                title: 'Advanced Analytics',
                description: 'Get real-time insights into your business performance',
                icon: '📊',
                image: 'https://placehold.co/400x300/10b981/ffffff?text=Analytics',
              },
              {
                title: 'Automated Workflows',
                description: 'Streamline your operations with intelligent automation',
                icon: '⚡',
                image: 'https://placehold.co/400x300/3b82f6/ffffff?text=Automation',
              },
              {
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security with 99.9% uptime guarantee',
                icon: '🔒',
                image: 'https://placehold.co/400x300/ef4444/ffffff?text=Security',
              },
            ],
          },
          {
            type: 'testimonials',
            title: 'What Our Customers Say',
            items: [
              {
                name: 'Sarah Johnson',
                role: 'CEO, TechCorp',
                quote: 'This product has transformed how we operate. Highly recommended!',
                image: 'https://placehold.co/100x100/6366f1/ffffff?text=SJ',
              },
              {
                name: 'Michael Chen',
                role: 'CTO, StartupXYZ',
                quote: 'The best investment we\'ve made this year. ROI is incredible.',
                image: 'https://placehold.co/100x100/8b5cf6/ffffff?text=MC',
              },
            ],
          },
        ],
      },
      metaTitle: 'Product Launch 2024 - Revolutionary Business Solution',
      metaDescription: 'Discover our new product that will transform your business operations.',
    },
    {
      name: 'Summer Sale Campaign',
      slug: 'summer-sale-2024',
      status: 'PUBLISHED',
      views: 3200,
      conversions: 179,
      conversionRate: 5.6,
      contentJson: {
        type: 'landing-page',
        sections: [
          {
            type: 'hero',
            title: 'Summer Sale - Up to 50% Off!',
            subtitle: 'Limited time offer. Don\'t miss out on amazing savings!',
            cta: { text: 'Shop Now', link: '/products' },
            backgroundImage: 'https://placehold.co/1920x1080/f59e0b/ffffff?text=Summer+Sale+50%25+OFF',
            badge: '50% OFF',
          },
          {
            type: 'products',
            title: 'Featured Products',
            items: [
              {
                name: 'Premium Package',
                price: '₹9,999',
                originalPrice: '₹19,999',
                image: 'https://placehold.co/300x300/2563eb/ffffff?text=Premium',
                discount: '50%',
              },
              {
                name: 'Business Suite',
                price: '₹14,999',
                originalPrice: '₹29,999',
                image: 'https://placehold.co/300x300/10b981/ffffff?text=Business',
                discount: '50%',
              },
              {
                name: 'Enterprise Plan',
                price: '₹24,999',
                originalPrice: '₹49,999',
                image: 'https://placehold.co/300x300/8b5cf6/ffffff?text=Enterprise',
                discount: '50%',
              },
            ],
          },
        ],
      },
      metaTitle: 'Summer Sale 2024 - Up to 50% Off',
      metaDescription: 'Huge summer sale with amazing discounts on all products.',
    },
    {
      name: 'Webinar Registration',
      slug: 'webinar-registration',
      status: 'DRAFT',
      views: 0,
      conversions: 0,
      conversionRate: 0,
      contentJson: {
        type: 'landing-page',
        sections: [
          {
            type: 'hero',
            title: 'Join Our Exclusive Webinar',
            subtitle: 'Learn from industry experts and grow your business',
            cta: { text: 'Register Now', link: '#register' },
            backgroundImage: 'https://placehold.co/1920x1080/6366f1/ffffff?text=Webinar+Registration',
          },
          {
            type: 'event-details',
            title: 'Event Details',
            date: 'January 15, 2025',
            time: '2:00 PM IST',
            duration: '60 minutes',
            format: 'Online',
            image: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Webinar+Event',
            speakers: [
              {
                name: 'Dr. Jane Smith',
                role: 'Industry Expert',
                image: 'https://placehold.co/150x150/10b981/ffffff?text=JS',
              },
              {
                name: 'John Doe',
                role: 'Business Strategist',
                image: 'https://placehold.co/150x150/3b82f6/ffffff?text=JD',
              },
            ],
          },
          {
            type: 'registration-form',
            title: 'Register for Free',
            fields: ['name', 'email', 'company'],
          },
        ],
      },
      metaTitle: 'Webinar Registration - Industry Insights',
      metaDescription: 'Register for our exclusive webinar on industry best practices.',
    },
    {
      name: 'Free Trial Signup',
      slug: 'free-trial',
      status: 'PUBLISHED',
      views: 2100,
      conversions: 126,
      conversionRate: 6.0,
      contentJson: {
        type: 'landing-page',
        sections: [
          {
            type: 'hero',
            title: 'Start Your Free Trial Today',
            subtitle: 'No credit card required. 14-day free trial with full access.',
            cta: { text: 'Start Free Trial', link: '/signup' },
            backgroundImage: 'https://placehold.co/1920x1080/10b981/ffffff?text=Free+Trial+14+Days',
          },
          {
            type: 'benefits',
            title: 'What You Get',
            items: [
              {
                title: 'Full Feature Access',
                description: 'Try all premium features for 14 days',
                icon: '✅',
                image: 'https://placehold.co/200x200/2563eb/ffffff?text=Features',
              },
              {
                title: 'No Credit Card',
                description: 'Start instantly without any payment',
                icon: '💳',
                image: 'https://placehold.co/200x200/10b981/ffffff?text=No+Card',
              },
              {
                title: 'Cancel Anytime',
                description: 'No commitments. Cancel whenever you want',
                icon: '🚫',
                image: 'https://placehold.co/200x200/ef4444/ffffff?text=Cancel',
              },
            ],
          },
        ],
      },
      metaTitle: 'Free Trial - Start Today',
      metaDescription: 'Start your free 14-day trial. No credit card required.',
    },
    {
      name: 'Enterprise Contact',
      slug: 'enterprise-contact',
      status: 'PUBLISHED',
      views: 850,
      conversions: 34,
      conversionRate: 4.0,
      contentJson: {
        type: 'landing-page',
        sections: [
          {
            type: 'hero',
            title: 'Enterprise Solutions',
            subtitle: 'Custom solutions for large organizations',
            cta: { text: 'Contact Sales', link: '/contact' },
            backgroundImage: 'https://placehold.co/1920x1080/1e40af/ffffff?text=Enterprise+Solutions',
          },
          {
            type: 'features',
            title: 'Enterprise Features',
            items: [
              {
                title: 'Dedicated Support',
                description: '24/7 dedicated account manager',
                icon: '👥',
                image: 'https://placehold.co/400x300/3b82f6/ffffff?text=Support',
              },
              {
                title: 'Custom Integration',
                description: 'Seamless integration with your existing systems',
                icon: '🔌',
                image: 'https://placehold.co/400x300/8b5cf6/ffffff?text=Integration',
              },
              {
                title: 'SLA Guarantee',
                description: '99.9% uptime with enterprise SLA',
                icon: '📋',
                image: 'https://placehold.co/400x300/10b981/ffffff?text=SLA',
              },
            ],
          },
        ],
      },
      metaTitle: 'Enterprise Solutions - Contact Us',
      metaDescription: 'Get in touch for custom enterprise solutions.',
    },
  ]

  // Delete existing landing pages
  await prisma.landingPage.deleteMany({ where: { tenantId } })

  for (const page of landingPages) {
    await prisma.landingPage.create({
      data: {
        tenantId,
        name: page.name,
        slug: page.slug,
        status: page.status,
        contentJson: page.contentJson,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        views: page.views,
        conversions: page.conversions,
        conversionRate: page.conversionRate,
      },
    })
  }
}

// Checkout Pages
async function seedCheckoutPages(tenantId: string) {
  const checkoutPages = [
    {
      name: 'Standard Checkout',
      slug: 'checkout-standard',
      status: 'PUBLISHED',
      paymentMethods: {
        upi: true,
        cards: true,
        netbanking: true,
        wallets: true,
      },
      couponsEnabled: true,
      showOrderSummary: true,
      showShippingOptions: true,
      contentJson: {
        type: 'checkout-page',
        header: {
          title: 'Complete Your Purchase',
          logo: 'https://placehold.co/150x50/2563eb/ffffff?text=Logo',
          showProgress: true,
        },
        orderSummary: {
          show: true,
          image: 'https://placehold.co/100x100/e5e7eb/6b7280?text=Product',
        },
        trustBadges: [
          { image: 'https://placehold.co/80x40/10b981/ffffff?text=Secure', alt: 'Secure Payment' },
          { image: 'https://placehold.co/80x40/3b82f6/ffffff?text=SSL', alt: 'SSL Encrypted' },
          { image: 'https://placehold.co/80x40/ef4444/ffffff?text=Trusted', alt: 'Trusted' },
        ],
        footer: {
          text: 'Secure checkout powered by PayAid',
          links: ['Privacy Policy', 'Terms of Service', 'Refund Policy'],
        },
      },
    },
    {
      name: 'Quick Checkout',
      slug: 'checkout-quick',
      status: 'PUBLISHED',
      paymentMethods: {
        upi: true,
        cards: true,
        netbanking: false,
        wallets: true,
      },
      couponsEnabled: false,
      showOrderSummary: true,
      showShippingOptions: false,
      contentJson: {
        type: 'checkout-page',
        header: {
          title: 'Fast & Secure Checkout',
          logo: 'https://placehold.co/150x50/10b981/ffffff?text=Quick',
          showProgress: false,
        },
        orderSummary: {
          show: true,
          image: 'https://placehold.co/100x100/e5e7eb/6b7280?text=Item',
        },
        trustBadges: [
          { image: 'https://placehold.co/80x40/10b981/ffffff?text=Fast', alt: 'Fast Checkout' },
        ],
        footer: {
          text: 'Powered by PayAid',
        },
      },
    },
    {
      name: 'Enterprise Checkout',
      slug: 'checkout-enterprise',
      status: 'DRAFT',
      paymentMethods: {
        upi: false,
        cards: true,
        netbanking: true,
        wallets: false,
      },
      couponsEnabled: true,
      showOrderSummary: true,
      showShippingOptions: true,
      contentJson: {
        type: 'checkout-page',
        header: {
          title: 'Enterprise Checkout',
          logo: 'https://placehold.co/150x50/1e40af/ffffff?text=Enterprise',
          showProgress: true,
        },
        orderSummary: {
          show: true,
          image: 'https://placehold.co/100x100/e5e7eb/6b7280?text=Order',
        },
        trustBadges: [
          { image: 'https://placehold.co/80x40/1e40af/ffffff?text=Enterprise', alt: 'Enterprise Grade' },
          { image: 'https://placehold.co/80x40/3b82f6/ffffff?text=Secure', alt: 'Secure' },
        ],
        footer: {
          text: 'Enterprise checkout with invoice support',
          links: ['Enterprise Terms', 'Support', 'Contact Sales'],
        },
      },
    },
    {
      name: 'Mobile Optimized Checkout',
      slug: 'checkout-mobile',
      status: 'PUBLISHED',
      paymentMethods: {
        upi: true,
        cards: true,
        netbanking: false,
        wallets: true,
      },
      couponsEnabled: true,
      showOrderSummary: false,
      showShippingOptions: true,
      contentJson: {
        type: 'checkout-page',
        header: {
          title: 'Checkout',
          logo: 'https://placehold.co/120x40/6366f1/ffffff?text=Mobile',
          showProgress: true,
        },
        orderSummary: {
          show: false,
        },
        trustBadges: [
          { image: 'https://placehold.co/60x30/10b981/ffffff?text=✓', alt: 'Verified' },
        ],
        footer: {
          text: 'Mobile-optimized checkout experience',
        },
      },
    },
  ]

  // Delete existing checkout pages
  await prisma.checkoutPage.deleteMany({ where: { tenantId } })

  for (const page of checkoutPages) {
    await prisma.checkoutPage.create({
      data: {
        tenantId,
        name: page.name,
        slug: page.slug,
        status: page.status,
        paymentMethods: page.paymentMethods,
        couponsEnabled: page.couponsEnabled,
        showOrderSummary: page.showOrderSummary,
        showShippingOptions: page.showShippingOptions,
        contentJson: page.contentJson,
      },
    })
  }
}

// Events
async function seedEvents(tenantId: string, contactIds: string[]) {
  const events = [
    {
      name: 'Product Launch Webinar',
      description: 'Join us for the launch of our revolutionary new product line',
      type: 'virtual',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: 'Online - Zoom',
      price: 0,
      capacity: 100,
      status: 'upcoming',
    },
    {
      name: 'Annual Business Conference 2024',
      description: 'Annual conference featuring industry leaders and networking opportunities',
      type: 'physical',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      location: 'Mumbai Convention Center',
      price: 5000,
      capacity: 500,
      status: 'upcoming',
    },
    {
      name: 'Tech Workshop Series',
      description: 'Hands-on workshops on the latest technologies and best practices',
      type: 'hybrid',
      startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: 'Bangalore Tech Park / Online',
      price: 2000,
      capacity: 50,
      status: 'upcoming',
    },
    {
      name: 'Customer Success Meetup',
      description: 'Quarterly meetup for customers to share success stories and best practices',
      type: 'virtual',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      location: 'Online - Microsoft Teams',
      price: 0,
      capacity: 200,
      status: 'upcoming',
    },
    {
      name: 'Holiday Networking Event',
      description: 'Year-end networking event with food, drinks, and great conversations',
      type: 'physical',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: 'Delhi Marriott Hotel',
      price: 1500,
      capacity: 150,
      status: 'upcoming',
    },
  ]

  // Delete existing events and registrations
  await prisma.eventRegistration.deleteMany({ where: { event: { tenantId } } })
  await prisma.event.deleteMany({ where: { tenantId } })

  const createdEvents = []
  for (const eventData of events) {
    const slug = eventData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const event = await prisma.event.create({
      data: {
        tenantId,
        title: eventData.name,
        description: eventData.description,
        slug,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        locationType: eventData.type.toUpperCase(),
        address: eventData.location,
        priceInr: eventData.price ? eventData.price : undefined,
        maxAttendees: eventData.capacity,
        status: eventData.status.toUpperCase(),
      },
    })
    createdEvents.push(event)

    // Create some registrations
    if (contactIds.length > 0) {
      const registrationCount = Math.min(3, contactIds.length)
      for (let i = 0; i < registrationCount; i++) {
        const contact = await prisma.contact.findUnique({
          where: { id: contactIds[i] },
        })
        if (contact) {
          await prisma.eventRegistration.create({
            data: {
              eventId: event.id,
              tenantId,
              name: contact.name,
              email: contact.email || `contact${i}@example.com`,
              phone: contact.phone || undefined,
              status: i === 0 ? 'CONFIRMED' : 'REGISTERED',
              registeredAt: new Date(Date.now() - (registrationCount - i) * 24 * 60 * 60 * 1000),
            },
          })
        }
      }
    }
  }
}

// AI Calls
async function seedAICalls(tenantId: string, contactIds: string[]) {
  if (contactIds.length === 0) return

  const calls = [
    {
      contactId: contactIds[0],
      direction: 'outbound',
      phoneNumber: '+919876543210',
      status: 'completed',
      duration: 180,
      sentiment: 'positive',
      isQualified: true,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[1] || contactIds[0],
      direction: 'outbound',
      phoneNumber: '+919876543211',
      status: 'completed',
      duration: 240,
      sentiment: 'neutral',
      isQualified: false,
      startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[2] || contactIds[0],
      direction: 'inbound',
      phoneNumber: '+919876543212',
      status: 'completed',
      duration: 300,
      sentiment: 'positive',
      isQualified: true,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[3] || contactIds[0],
      direction: 'outbound',
      phoneNumber: '+919876543213',
      status: 'completed',
      duration: 150,
      sentiment: 'negative',
      isQualified: false,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[4] || contactIds[0],
      direction: 'inbound',
      phoneNumber: '+919876543214',
      status: 'completed',
      duration: 420,
      sentiment: 'positive',
      isQualified: true,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[5] || contactIds[0],
      direction: 'outbound',
      phoneNumber: '+919876543215',
      status: 'failed',
      duration: 0,
      sentiment: null,
      isQualified: false,
      startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[6] || contactIds[0],
      direction: 'inbound',
      phoneNumber: '+919876543216',
      status: 'completed',
      duration: 200,
      sentiment: 'neutral',
      isQualified: false,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      contactId: contactIds[7] || contactIds[0],
      direction: 'outbound',
      phoneNumber: '+919876543217',
      status: 'completed',
      duration: 360,
      sentiment: 'positive',
      isQualified: true,
      startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  ]

  // Delete existing calls and related data
  await prisma.callTranscript.deleteMany({ where: { call: { tenantId } } })
  await prisma.callRecording.deleteMany({ where: { call: { tenantId } } })
  await prisma.aICall.deleteMany({ where: { tenantId } })

  const createdCalls = []
  for (const callData of calls) {
    const call = await prisma.aICall.create({
      data: {
        tenantId,
        contactId: callData.contactId,
        phoneNumber: callData.phoneNumber,
        direction: callData.direction.toUpperCase(),
        status: callData.status.toUpperCase(),
        duration: callData.duration,
        startedAt: callData.startedAt,
      },
    })
    createdCalls.push(call)

    // Create transcript for completed calls
    if (call.status === 'COMPLETED') {
      await prisma.callTranscript.create({
        data: {
          callId: call.id,
          tenantId,
          transcript: `[AI]: Hello, this is an AI assistant calling from Demo Business. How can I help you today?\n\n[Customer]: Hi, I'm interested in learning more about your services.\n\n[AI]: Great! I'd be happy to help. What specific services are you interested in?\n\n[Customer]: I'm looking for enterprise solutions.\n\n[AI]: Perfect! We have comprehensive enterprise solutions. Let me connect you with our sales team.\n\n[Customer]: That would be great, thank you!`,
          keyPoints: ['Customer interested in enterprise solutions', 'Requested connection with sales team'] as any,
          sentiment: 'positive',
        },
      })
    }
  }

  // Create Call FAQs
  const faqs = [
    {
      question: 'What are your business hours?',
      answer: 'Our business hours are Monday to Friday, 9 AM to 6 PM IST.',
      usageCount: 45,
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, UPI, net banking, and bank transfers.',
      usageCount: 32,
    },
    {
      question: 'How can I get technical support?',
      answer: 'You can reach our technical support team via email at support@demobusiness.com or through our help center.',
      usageCount: 28,
    },
    {
      question: 'What is your refund policy?',
      answer: 'We offer a 30-day money-back guarantee for all our products and services.',
      usageCount: 15,
    },
  ]

  await prisma.callFAQ.deleteMany({ where: { tenantId } })

  for (const faq of faqs) {
    await prisma.callFAQ.create({
      data: {
        tenantId,
        question: faq.question,
        answer: faq.answer,
      },
    })
  }
}

// Logos
async function seedLogos(tenantId: string) {
  const logos = [
    {
      businessName: 'Demo Business',
      industry: 'Technology',
      style: 'modern',
      status: 'COMPLETED',
      prompt: 'Modern tech company logo with geometric shapes',
      colors: ['#2563eb', '#10b981'],
      modelUsed: 'stable-diffusion',
    },
    {
      businessName: 'Tech Solutions Inc',
      industry: 'Software',
      style: 'minimal',
      status: 'COMPLETED',
      prompt: 'Minimalist software company logo',
      colors: ['#000000', '#ffffff'],
      modelUsed: 'stable-diffusion',
    },
    {
      businessName: 'Creative Agency',
      industry: 'Marketing',
      style: 'playful',
      status: 'GENERATING',
      prompt: 'Playful and creative marketing agency logo',
      colors: ['#ff6b6b', '#4ecdc4', '#ffe66d'],
      modelUsed: null,
    },
    {
      businessName: 'Enterprise Corp',
      industry: 'Business',
      style: 'elegant',
      status: 'COMPLETED',
      prompt: 'Elegant corporate logo for enterprise business',
      colors: ['#1e40af', '#6366f1'],
      modelUsed: 'stable-diffusion',
    },
    {
      businessName: 'Startup Co',
      industry: 'Technology',
      style: 'modern',
      status: 'COMPLETED',
      prompt: 'Modern startup logo with bold colors',
      colors: ['#ef4444', '#f59e0b'],
      modelUsed: 'stable-diffusion',
    },
  ]

  // Delete existing logos and variations
  await prisma.logoVariation.deleteMany({ where: { logo: { tenantId } } })
  await prisma.logo.deleteMany({ where: { tenantId } })

  for (const logoData of logos) {
    const logo = await prisma.logo.create({
      data: {
        tenantId,
        businessName: logoData.businessName,
        industry: logoData.industry,
        style: logoData.style,
        status: logoData.status,
        prompt: logoData.prompt,
        colors: logoData.colors,
        modelUsed: logoData.modelUsed,
      },
    })

    // Create variations for completed logos
    if (logo.status === 'COMPLETED') {
      const variations = [
        { style: 'modern', color: '2563eb' },
        { style: 'minimal', color: '10b981' },
        { style: 'playful', color: 'f59e0b' },
      ]
      
      for (let idx = 0; idx < variations.length; idx++) {
        const variation = variations[idx]
        // Use shorter, simpler URLs that will definitely work
        const shortName = logo.businessName.replace(/\s+/g, '').substring(0, 10)
        const imageUrl = `https://placehold.co/800x600/${variation.color}/ffffff?text=${shortName}`
        const thumbnailUrl = `https://placehold.co/256x256/${variation.color}/ffffff?text=${shortName}`
        
        await prisma.logoVariation.create({
          data: {
            logoId: logo.id,
            iconStyle: variation.style,
            imageUrl,
            thumbnailUrl,
            tenantId,
            isSelected: idx === 0, // First variation is selected
          },
        })
      }
    }
  }
}

// Website Chatbots
async function seedWebsiteChatbots(tenantId: string, contactIds: string[]) {
  const websites = await prisma.website.findMany({
    where: { tenantId },
    take: 3,
  })

  if (websites.length === 0) return

  const chatbots = [
    {
      websiteId: websites[0].id,
      name: 'Main Website Assistant',
      position: 'bottom-right',
      welcomeMessage: 'Hi! How can I help you today?',
      autoGreet: true,
      isActive: true,
    },
    {
      websiteId: websites[0].id,
      name: 'Product Support Bot',
      position: 'bottom-left',
      welcomeMessage: 'Need help with our products? Ask me anything!',
      autoGreet: false,
      isActive: true,
    },
    {
      websiteId: websites[1]?.id || websites[0].id,
      name: 'Sales Assistant',
      position: 'bottom-right',
      welcomeMessage: 'Interested in our services? Let\'s chat!',
      autoGreet: true,
      isActive: true,
    },
  ]

  // Delete existing chatbots and conversations
  await prisma.chatbotConversation.deleteMany({ where: { chatbot: { website: { tenantId } } } })
  await prisma.websiteChatbot.deleteMany({ where: { website: { tenantId } } })

  const createdChatbots = []
  for (const chatbotData of chatbots) {
    const chatbot = await prisma.websiteChatbot.create({
      data: {
        ...chatbotData,
        tenantId,
        knowledgeBase: [
          { question: 'What are your business hours?', answer: 'We are open Monday to Friday, 9 AM to 6 PM.' },
          { question: 'How can I contact support?', answer: 'You can reach us at support@demobusiness.com' },
          { question: 'Do you offer free trials?', answer: 'Yes, we offer a 14-day free trial with no credit card required.' },
        ] as any,
      },
    })
    createdChatbots.push(chatbot)

    // Create sample conversations
    if (contactIds.length > 0) {
      await prisma.chatbotConversation.create({
        data: {
          chatbotId: chatbot.id,
          contactId: contactIds[0],
          visitorId: `visitor-${chatbot.id}`,
          sessionId: `session-${chatbot.id}-${Date.now()}`,
          tenantId,
          messages: JSON.stringify([
            { role: 'user', content: 'Hello, I need help' },
            { role: 'assistant', content: 'Hi! I\'d be happy to help. What do you need assistance with?' },
            { role: 'user', content: 'What are your business hours?' },
            { role: 'assistant', content: 'We are open Monday to Friday, 9 AM to 6 PM.' },
          ]),
          qualified: true,
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }
}

// Custom Dashboards
async function seedCustomDashboards(tenantId: string) {
  const dashboards = [
    {
      name: 'Sales Overview',
      description: 'Comprehensive sales performance dashboard',
      layout: JSON.stringify({
        grid: { columns: 12, rows: 8 },
        widgets: [
          { id: 'revenue', type: 'metric', x: 0, y: 0, w: 3, h: 2, config: { title: 'Total Revenue', value: '₹25,00,000' } },
          { id: 'deals', type: 'metric', x: 3, y: 0, w: 3, h: 2, config: { title: 'Active Deals', value: '15' } },
          { id: 'conversion', type: 'metric', x: 6, y: 0, w: 3, h: 2, config: { title: 'Conversion Rate', value: '22%' } },
          { id: 'pipeline', type: 'chart', x: 0, y: 2, w: 6, h: 4, config: { type: 'bar', title: 'Deal Pipeline' } },
          { id: 'trends', type: 'chart', x: 6, y: 2, w: 6, h: 4, config: { type: 'line', title: 'Revenue Trends' } },
        ],
      }),
      isPublic: false,
    },
    {
      name: 'Marketing Performance',
      description: 'Marketing campaigns and lead generation metrics',
      layout: JSON.stringify({
        grid: { columns: 12, rows: 8 },
        widgets: [
          { id: 'campaigns', type: 'metric', x: 0, y: 0, w: 4, h: 2, config: { title: 'Active Campaigns', value: '8' } },
          { id: 'leads', type: 'metric', x: 4, y: 0, w: 4, h: 2, config: { title: 'New Leads', value: '125' } },
          { id: 'roi', type: 'metric', x: 8, y: 0, w: 4, h: 2, config: { title: 'ROI', value: '180%' } },
          { id: 'campaign-performance', type: 'chart', x: 0, y: 2, w: 12, h: 6, config: { type: 'bar', title: 'Campaign Performance' } },
        ],
      }),
      isPublic: false,
    },
    {
      name: 'Customer Analytics',
      description: 'Customer behavior and engagement metrics',
      layout: JSON.stringify({
        grid: { columns: 12, rows: 8 },
        widgets: [
          { id: 'customers', type: 'metric', x: 0, y: 0, w: 3, h: 2, config: { title: 'Total Customers', value: '450' } },
          { id: 'satisfaction', type: 'metric', x: 3, y: 0, w: 3, h: 2, config: { title: 'Satisfaction Score', value: '4.8/5' } },
          { id: 'retention', type: 'metric', x: 6, y: 0, w: 3, h: 2, config: { title: 'Retention Rate', value: '92%' } },
          { id: 'engagement', type: 'chart', x: 0, y: 2, w: 12, h: 6, config: { type: 'line', title: 'Customer Engagement' } },
        ],
      }),
      isPublic: false,
    },
    {
      name: 'Operations Dashboard',
      description: 'Operational metrics and task management',
      layout: JSON.stringify({
        grid: { columns: 12, rows: 8 },
        widgets: [
          { id: 'tasks', type: 'metric', x: 0, y: 0, w: 4, h: 2, config: { title: 'Pending Tasks', value: '12' } },
          { id: 'completed', type: 'metric', x: 4, y: 0, w: 4, h: 2, config: { title: 'Completed Today', value: '8' } },
          { id: 'overdue', type: 'metric', x: 8, y: 0, w: 4, h: 2, config: { title: 'Overdue', value: '3' } },
          { id: 'task-breakdown', type: 'chart', x: 0, y: 2, w: 12, h: 6, config: { type: 'pie', title: 'Task Breakdown' } },
        ],
      }),
      isPublic: false,
    },
  ]

  // Delete existing dashboards
  await prisma.customDashboard.deleteMany({ where: { tenantId } })

  for (const dashboard of dashboards) {
    await prisma.customDashboard.create({
      data: {
        tenantId,
        ...dashboard,
        layoutJson: dashboard.layout ? JSON.parse(dashboard.layout) : {},
        widgets: [],
      },
    })
  }
}

// Custom Reports
async function seedCustomReports(tenantId: string) {
  const reports = [
    {
      name: 'Monthly Sales Report',
      description: 'Comprehensive monthly sales performance report',
      type: 'sales',
      schedule: 'monthly',
      filters: JSON.stringify({ dateRange: 'lastMonth', status: 'all' }),
      columns: JSON.stringify(['date', 'deal', 'value', 'stage', 'probability']),
      lastGeneratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Customer Acquisition Report',
      description: 'Weekly report on new customer acquisitions',
      type: 'acquisition',
      schedule: 'weekly',
      filters: JSON.stringify({ dateRange: 'lastWeek', source: 'all' }),
      columns: JSON.stringify(['date', 'contact', 'source', 'value', 'status']),
      lastGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Campaign Performance Report',
      description: 'Detailed analysis of marketing campaign performance',
      type: 'marketing',
      schedule: 'weekly',
      filters: JSON.stringify({ dateRange: 'lastWeek', campaignType: 'all' }),
      columns: JSON.stringify(['campaign', 'type', 'sent', 'opened', 'clicked', 'conversion']),
      lastGeneratedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Revenue Analysis Report',
      description: 'Quarterly revenue analysis and trends',
      type: 'financial',
      schedule: 'monthly',
      filters: JSON.stringify({ dateRange: 'lastQuarter', product: 'all' }),
      columns: JSON.stringify(['month', 'revenue', 'invoices', 'customers', 'growth']),
      lastGeneratedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Lead Source ROI Report',
      description: 'ROI analysis by lead source',
      type: 'analytics',
      schedule: 'monthly',
      filters: JSON.stringify({ dateRange: 'lastMonth', source: 'all' }),
      columns: JSON.stringify(['source', 'leads', 'conversions', 'value', 'roi']),
      lastGeneratedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]

  // Delete existing reports
  await prisma.customReport.deleteMany({ where: { tenantId } })

  for (const report of reports) {
    await prisma.customReport.create({
      data: {
        tenantId,
        ...report,
        reportType: report.type,
      },
    })
  }
}

// WhatsApp Data
async function seedWhatsAppData(tenantId: string, contactIds: string[]) {
  // Get or create WhatsApp account
  let whatsappAccount = await prisma.whatsappAccount.findFirst({
    where: { tenantId },
  })

  if (!whatsappAccount) {
    whatsappAccount = await prisma.whatsappAccount.create({
      data: {
        tenantId,
        channelType: 'web',
        wahaBaseUrl: 'http://localhost:3000',
        wahaApiKey: 'demo-api-key',
        isWebConnected: true,
        businessName: 'Demo Business WhatsApp',
        primaryPhone: '+919876543210',
        status: 'active',
      },
    })
  }

  // Create sessions
  const sessions = []
  for (let i = 0; i < 2; i++) {
    const session = await prisma.whatsappSession.create({
      data: {
        accountId: whatsappAccount.id,
        providerSessionId: `session-${tenantId}-${i}`,
        status: i === 0 ? 'connected' : 'pending_qr',
        deviceName: i === 0 ? 'Admin Phone' : 'Sales Phone',
        qrCodeUrl: i === 1 ? 'https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=demo-qr' : null,
      },
    })
    sessions.push(session)
  }

  // Create contact identities
  if (contactIds.length > 0) {
    for (let i = 0; i < Math.min(5, contactIds.length); i++) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactIds[i] },
      })

      if (contact && contact.phone) {
        await prisma.whatsappContactIdentity.upsert({
          where: {
            whatsappNumber: contact.phone || `+91${contactIds[i]}`,
          },
          update: {},
          create: {
            contactId: contactIds[i],
            whatsappNumber: contact.phone,
            verified: true,
            verificationDate: new Date(),
          },
        })

        // Create conversations
        const conversation = await prisma.whatsappConversation.create({
          data: {
            accountId: whatsappAccount.id,
            contactId: contactIds[i],
            sessionId: sessions[0].id,
            status: i % 2 === 0 ? 'open' : 'closed',
            lastMessageAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
            lastDirection: i % 2 === 0 ? 'in' : 'out',
            unreadCount: i % 2 === 0 ? 1 : 0,
          },
        })

        // Create messages
        await prisma.whatsappMessage.create({
          data: {
            conversationId: conversation.id,
            sessionId: sessions[0].id,
            direction: 'in',
            messageType: 'text',
            whatsappMessageId: `msg-${Date.now()}-${i}-1`,
            fromNumber: contact.phone,
            toNumber: '+919876543210',
            text: i % 2 === 0 ? 'Hello! I need help with my order.' : 'When will my product be delivered?',
            status: 'delivered',
            createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
          },
        })

        await prisma.whatsappMessage.create({
          data: {
            conversationId: conversation.id,
            sessionId: sessions[0].id,
            direction: 'out',
            messageType: 'text',
            whatsappMessageId: `msg-${Date.now()}-${i}-2`,
            fromNumber: '+919876543210',
            toNumber: contact.phone,
            text: i % 2 === 0 ? 'Hi! I can help you with that. What\'s your order number?' : 'Your order will be delivered within 2-3 business days.',
            status: 'read',
            sentAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
            deliveredAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
            readAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000 + 35 * 60 * 1000),
            createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
          },
        })
      }
    }
  }

  // Create WhatsApp templates
  const templates = [
    {
      accountId: whatsappAccount.id,
      name: 'Order Confirmation',
      category: 'order_update',
      languageCode: 'en',
      bodyTemplate: 'Hi {{1}}, your order {{2}} has been confirmed and will be delivered on {{3}}.',
    },
    {
      accountId: whatsappAccount.id,
      name: 'Appointment Reminder',
      category: 'appointment',
      languageCode: 'en',
      bodyTemplate: 'Reminder: Your appointment is scheduled for {{1}} at {{2}}. Reply CONFIRM to confirm.',
    },
    {
      accountId: whatsappAccount.id,
      name: 'Payment Received',
      category: 'payment',
      languageCode: 'en',
      bodyTemplate: 'Thank you! We have received your payment of ₹{{1}} for invoice {{2}}.',
    },
  ]

  await prisma.whatsappTemplate.deleteMany({ where: { account: { tenantId } } })

  for (const template of templates) {
    await prisma.whatsappTemplate.create({
      data: template,
    })
  }
}

// Webmail (Email Accounts, Folders, Messages)
async function seedWebmail(tenantId: string) {
  // Get first user for email accounts
  const user = await prisma.user.findFirst({
    where: { tenantId },
  })

  if (!user) return

  // Create email accounts
  const emailAccounts = [
    {
      email: 'admin@demobusiness.com',
      displayName: 'Admin User',
      storageQuotaMB: 25000,
      storageUsedMB: 1250,
    },
    {
      email: 'sales@demobusiness.com',
      displayName: 'Sales Team',
      storageQuotaMB: 25000,
      storageUsedMB: 850,
    },
  ]

  await prisma.emailMessage.deleteMany({ where: { account: { tenantId } } })
  await prisma.emailFolder.deleteMany({ where: { account: { tenantId } } })
  await prisma.emailAccount.deleteMany({ where: { tenantId } })

  const createdAccounts = []
  for (const accountData of emailAccounts) {
    const account = await prisma.emailAccount.create({
      data: {
        tenantId,
        userId: user.id,
        email: accountData.email,
        displayName: accountData.displayName,
        password: 'hashed_password_placeholder',
        storageQuotaMB: accountData.storageQuotaMB,
        storageUsedMB: accountData.storageUsedMB,
        imapHost: 'imap.payaid.io',
        smtpHost: 'smtp.payaid.io',
        isActive: true,
      },
    })
    createdAccounts.push(account)

    // Create default folders
    const folders = [
      { name: 'Inbox', type: 'inbox', displayOrder: 1 },
      { name: 'Sent', type: 'sent', displayOrder: 2 },
      { name: 'Drafts', type: 'drafts', displayOrder: 3 },
      { name: 'Trash', type: 'trash', displayOrder: 4 },
      { name: 'Spam', type: 'spam', displayOrder: 5 },
      { name: 'Archive', type: 'archive', displayOrder: 6 },
    ]

    const createdFolders = []
    for (const folderData of folders) {
      const folder = await prisma.emailFolder.create({
        data: {
          accountId: account.id,
          name: folderData.name,
          type: folderData.type,
          displayOrder: folderData.displayOrder,
        },
      })
      createdFolders.push(folder)
    }

    // Create sample messages in Inbox
    const inboxFolder = createdFolders.find((f) => f.type === 'inbox')
    if (inboxFolder) {
      const messages = [
        {
          messageId: `<msg-${Date.now()}-1@payaid.io>`,
          fromEmail: 'customer@example.com',
          fromName: 'John Customer',
          toEmails: [account.email],
          subject: 'Inquiry about your services',
          body: 'Hello,\n\nI am interested in learning more about your services.',
          htmlBody: '<p>Hello,</p><p>I am interested in learning more about your services.</p>',
          isRead: false,
          receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          messageId: `<msg-${Date.now()}-2@payaid.io>`,
          fromEmail: 'partner@company.com',
          fromName: 'Sarah Partner',
          toEmails: [account.email],
          subject: 'Partnership opportunity',
          body: 'Hi there,\n\nWe would like to discuss a potential partnership.',
          htmlBody: '<p>Hi there,</p><p>We would like to discuss a potential partnership.</p>',
          isRead: true,
          isStarred: true,
          receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          messageId: `<msg-${Date.now()}-3@payaid.io>`,
          fromEmail: 'support@vendor.com',
          fromName: 'Support Team',
          toEmails: [account.email],
          subject: 'Your order has been shipped',
          body: 'Your order #12345 has been shipped.',
          htmlBody: '<p>Your order #12345 has been shipped.</p>',
          isRead: false,
          receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      ]

      for (const msgData of messages) {
        await prisma.emailMessage.create({
          data: {
            accountId: account.id,
            folderId: inboxFolder.id,
            ...msgData,
          },
        })
      }

      // Update folder counts
      await prisma.emailFolder.update({
        where: { id: inboxFolder.id },
        data: {
          unreadCount: messages.filter((m) => !m.isRead).length,
          totalCount: messages.length,
        },
      })
    }
  }
}

// Team Chat
async function seedTeamChat(tenantId: string) {
  // Get first user for chat member
  const user = await prisma.user.findFirst({
    where: { tenantId },
  })

  if (!user) return

  // Create or get workspace
  let workspace = await prisma.chatWorkspace.findFirst({
    where: { tenantId },
  })

  if (!workspace) {
    workspace = await prisma.chatWorkspace.create({
      data: {
        tenantId,
        name: 'Demo Business Workspace',
        description: 'Team communication workspace',
      },
    })
  }

  // Create or get chat member
  let chatMember = await prisma.chatMember.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: user.id,
    },
  })

  if (!chatMember) {
    chatMember = await prisma.chatMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        displayName: user.name || user.email,
        status: 'online',
      },
    })
  }

  // Create channels
  const channels = [
    { name: 'general', description: 'General team discussions', isPrivate: false },
    { name: 'sales', description: 'Sales team discussions', isPrivate: false },
    { name: 'announcements', description: 'Company announcements', isPrivate: false },
  ]

  await prisma.chatChannelMessage.deleteMany({ where: { channel: { workspaceId: workspace.id } } })
  await prisma.chatChannelMember.deleteMany({ where: { channel: { workspaceId: workspace.id } } })
  await prisma.chatChannel.deleteMany({ where: { workspaceId: workspace.id } })

  const createdChannels = []
  for (const channelData of channels) {
    const channel = await prisma.chatChannel.create({
      data: {
        workspaceId: workspace.id,
        ...channelData,
      },
    })
    createdChannels.push(channel)

    // Add member to channel
    await prisma.chatChannelMember.create({
      data: {
        channelId: channel.id,
        memberId: chatMember.id,
        role: 'admin',
      },
    })

    // Create sample messages
    const messages = [
      {
        content: channel.name === 'general' ? 'Welcome to the team chat! 👋' : `Welcome to #${channel.name}!`,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        content: channel.name === 'sales' ? 'New lead from TechCorp wants to discuss a deal worth ₹5L' : 'Let\'s discuss our goals for this quarter.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ]

    for (const msgData of messages) {
      await prisma.chatChannelMessage.create({
        data: {
          channelId: channel.id,
          senderId: chatMember.id,
          ...msgData,
        },
      })
    }
  }
}

// HR Employees
async function seedHREmployees(tenantId: string) {
  // Get or create departments
  let dept = await prisma.department.findFirst({
    where: { tenantId },
  })

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        tenantId,
        name: 'Engineering',
        code: 'ENG',
      },
    })
  }

  // Get or create designation
  let designation = await prisma.designation.findFirst({
    where: { tenantId },
  })

  if (!designation) {
    designation = await prisma.designation.create({
      data: {
        tenantId,
        name: 'Software Engineer',
        code: 'SE',
      },
    })
  }

  // Get or create location
  let location = await prisma.location.findFirst({
    where: { tenantId },
  })

  if (!location) {
    location = await prisma.location.create({
      data: {
        tenantId,
        name: 'Bangalore Office',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
      },
    })
  }

  const employees = [
    {
      employeeCode: 'EMP001',
      firstName: 'Raj',
      lastName: 'Kumar',
      officialEmail: 'raj.kumar@demobusiness.com',
      mobileNumber: '9876543210',
      joiningDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      ctcAnnualInr: 1200000,
      fixedComponentInr: 1000000,
      variableComponentInr: 200000,
    },
    {
      employeeCode: 'EMP002',
      firstName: 'Priya',
      lastName: 'Sharma',
      officialEmail: 'priya.sharma@demobusiness.com',
      mobileNumber: '9876543211',
      joiningDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      ctcAnnualInr: 1500000,
      fixedComponentInr: 1200000,
      variableComponentInr: 300000,
    },
    {
      employeeCode: 'EMP003',
      firstName: 'Amit',
      lastName: 'Patel',
      officialEmail: 'amit.patel@demobusiness.com',
      mobileNumber: '9876543212',
      joiningDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      status: 'PROBATION',
      ctcAnnualInr: 1000000,
      fixedComponentInr: 850000,
      variableComponentInr: 150000,
    },
  ]

  await prisma.employee.deleteMany({ where: { tenantId } })

  const createdEmployees = []
  for (const empData of employees) {
    const employee = await prisma.employee.create({
      data: {
        tenantId,
        ...empData,
        departmentId: dept.id,
        designationId: designation.id,
        locationId: location.id,
        pfApplicable: true,
        esiApplicable: true,
        ptApplicable: true,
        tdsApplicable: true,
      },
    })
    createdEmployees.push(employee)
  }

  // Set manager relationships
  if (createdEmployees.length >= 2) {
    await prisma.employee.update({
      where: { id: createdEmployees[1].id },
      data: { managerId: createdEmployees[0].id },
    })
    if (createdEmployees.length >= 3) {
      await prisma.employee.update({
        where: { id: createdEmployees[2].id },
        data: { managerId: createdEmployees[0].id },
      })
    }
  }
}

// Payroll
async function seedPayroll(tenantId: string) {
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    take: 3,
  })

  if (employees.length === 0) return

  // Create payroll cycle
  const cycle = await prisma.payrollCycle.upsert({
    where: {
      tenantId_month_year_runType: {
        tenantId,
        month: 1,
        year: 2025,
        runType: 'REGULAR',
      },
    },
    update: {},
    create: {
      tenantId,
      month: 1,
      year: 2025,
      runType: 'REGULAR',
      status: 'COMPLETED',
    },
  })

  // Create payroll runs for each employee
  await prisma.payrollRun.deleteMany({ where: { cycleId: cycle.id } })

  for (const employee of employees) {
    const grossEarnings = Number(employee.fixedComponentInr || 0)
    const pfEmployee = grossEarnings * 0.12
    const pfEmployer = grossEarnings * 0.12
    const esiEmployee = grossEarnings * 0.0075
    const esiEmployer = grossEarnings * 0.0325
    const pt = 200
    const tds = grossEarnings * 0.05
    const grossDeductions = pfEmployee + esiEmployee + pt + tds
    const netPay = grossEarnings - grossDeductions

    await prisma.payrollRun.create({
      data: {
        cycleId: cycle.id,
        employeeId: employee.id,
        tenantId,
        grossEarningsInr: grossEarnings,
        grossDeductionsInr: grossDeductions,
        pfEmployeeInr: pfEmployee,
        pfEmployerInr: pfEmployer,
        esiEmployeeInr: esiEmployee,
        esiEmployerInr: esiEmployer,
        ptInr: pt,
        tdsInr: tds,
        lopDays: 0,
        lopAmountInr: 0,
        netPayInr: netPay,
        daysPaid: 31,
        payoutStatus: 'COMPLETED',
        paidAt: new Date('2025-02-01'),
      },
    })
  }
}

// Hiring (Job Postings & Candidates)
async function seedHiring(tenantId: string) {
  // Get or create department
  const dept = await prisma.department.findFirst({
    where: { tenantId },
  })

  if (!dept) return

  // Get a user for requestedBy
  const user = await prisma.user.findFirst({
    where: { tenantId },
  })
  if (!user) return

  // Create job requisition
  const requisition = await prisma.jobRequisition.create({
    data: {
      tenantId,
      departmentId: dept.id,
      title: 'Senior Software Engineer',
      status: 'OPEN',
      requestedBy: user.id,
    },
  })

  // Create job posting
  const posting = await prisma.jobPosting.create({
    data: {
      requisitionId: requisition.id,
      status: 'POSTED',
    },
  })

  // Create candidates
  const candidates = [
    {
      fullName: 'Ravi Verma',
      email: 'ravi.verma@example.com',
      phone: '9876543213',
      resumeFileUrl: 'https://placehold.co/800x1000/e5e7eb/6b7280?text=Resume',
      status: 'NEW',
      source: 'LinkedIn',
      skills: ['JavaScript', 'React', 'Node.js'],
    },
    {
      fullName: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      phone: '9876543214',
      resumeFileUrl: 'https://placehold.co/800x1000/e5e7eb/6b7280?text=Resume',
      status: 'SCREENING',
      source: 'Referral',
      skills: ['TypeScript', 'React', 'AWS'],
    },
  ]

  for (const candidateData of candidates) {
    const candidate = await prisma.candidate.create({
      data: {
        tenantId,
        ...candidateData,
      },
    })

    // Link candidate to requisition
    await prisma.candidateJob.create({
      data: {
        candidateId: candidate.id,
        requisitionId: requisition.id,
        stage: candidateData.status === 'NEW' ? 'APPLIED' : 'SCREENING',
      },
    })
  }
}

// GST Reports
async function seedGSTReports(tenantId: string) {
  // Get invoices for GST reports
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    take: 10,
  })

  if (invoices.length === 0) return

  // Create GST report entries (stored as custom reports with GST type)
  const gstReports = [
    {
      name: 'GST Sales Report - January 2025',
      description: 'Monthly GST sales report with tax breakdown',
      reportType: 'gst',
      filters: {
        dateRange: 'month',
        month: 1,
        year: 2025,
        reportType: 'sales',
      },
      columns: ['invoiceNumber', 'invoiceDate', 'customerName', 'gstin', 'cgst', 'sgst', 'igst', 'total'],
    },
    {
      name: 'GST Purchase Report - January 2025',
      description: 'Monthly GST purchase report with input tax credit',
      reportType: 'gst',
      filters: {
        dateRange: 'month',
        month: 1,
        year: 2025,
        reportType: 'purchase',
      },
      columns: ['vendorName', 'invoiceNumber', 'invoiceDate', 'gstin', 'cgst', 'sgst', 'igst', 'total'],
    },
    {
      name: 'GSTR-1 Summary',
      description: 'GSTR-1 return summary for filing',
      reportType: 'gst',
      filters: {
        dateRange: 'month',
        month: 1,
        year: 2025,
        reportType: 'gstr1',
      },
      columns: ['taxRate', 'taxableValue', 'cgst', 'sgst', 'igst', 'cess'],
    },
  ]

  for (const reportData of gstReports) {
    await prisma.customReport.create({
      data: {
        tenantId,
        ...reportData,
        scheduleEnabled: false,
        exportFormats: ['csv', 'pdf', 'excel'],
      },
    })
  }
}

// Run the seeder
seedAllSampleData()
  .catch((e) => {
    console.error('❌ Error seeding sample data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
