/**
 * Hard Reset Function for Demo Business Pvt Ltd
 * Deletes ALL demo business data across all modules before reseeding
 */

import type { PrismaClient } from '@prisma/client'

export async function resetDemoBusinessData(prisma: PrismaClient, tenantId: string) {
  console.log(`🗑️  Resetting all data for tenant: ${tenantId}`)
  
  // Order matters because of FK constraints - delete children first
  
  // Audit & Logs
  try {
    await prisma.auditLog.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    await prisma.apiUsageLog.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Activities & Tasks
  try {
    if (prisma.activityFeed) {
      await prisma.activityFeed.deleteMany({ where: { tenantId } })
    }
  } catch {}
  await prisma.task.deleteMany({ where: { tenantId } })
  await prisma.meeting.deleteMany({ where: { tenantId } })
  
  // Support (if models exist - they may not in this schema)
  try {
    await prisma.supportTicket.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    await prisma.supportReply.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Sales & Billing - Order items first
  await prisma.orderItem.deleteMany({ where: { order: { tenantId } } })
  await prisma.order.deleteMany({ where: { tenantId } })
  try {
    await prisma.invoiceItem.deleteMany({ where: { invoice: { tenantId } } })
  } catch {}
  await prisma.invoice.deleteMany({ where: { tenantId } })
  try {
    await prisma.payment.deleteMany({ where: { tenantId } })
  } catch {}
  // Subscription is tenant-level, don't delete it
  
  // Marketing
  try {
    await prisma.campaignEvent.deleteMany({ where: { campaign: { tenantId } } })
  } catch {}
  await prisma.campaign.deleteMany({ where: { tenantId } })
  try {
    await prisma.emailEvent.deleteMany({ where: { tenantId } })
  } catch {}
  await prisma.landingPage.deleteMany({ where: { tenantId } })
  try {
    await prisma.leadSource.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    await prisma.scheduledEmail.deleteMany({ where: { tenantId } })
  } catch {}
  
  // CRM - Deals first (may reference contacts)
  await prisma.deal.deleteMany({ where: { tenantId } })
  await prisma.contact.deleteMany({ where: { tenantId } })
  try {
    await prisma.company.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Products
  await prisma.product.deleteMany({ where: { tenantId } })
  
  // Email & Communication
  try {
    await prisma.emailMessage.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.emailFolder.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.emailAccount.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    await prisma.emailTemplate.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Chat
  try {
    await prisma.chatChannelMessage.deleteMany({ where: { channel: { workspace: { tenantId } } } })
  } catch {}
  try {
    await prisma.chatChannelMember.deleteMany({ where: { channel: { workspace: { tenantId } } } })
  } catch {}
  try {
    await prisma.chatChannel.deleteMany({ where: { workspace: { tenantId } } })
  } catch {}
  try {
    await prisma.chatMember.deleteMany({ where: { workspace: { tenantId } } })
  } catch {}
  try {
    await prisma.chatWorkspace.deleteMany({ where: { tenantId } })
  } catch {}
  
  // WhatsApp
  try {
    await prisma.whatsappMessage.deleteMany({ where: { conversation: { account: { tenantId } } } })
  } catch {}
  try {
    await prisma.whatsappConversation.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.whatsappSession.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.whatsappTemplate.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.whatsappAccount.deleteMany({ where: { tenantId } })
  } catch {}
  
  // AI Calls
  try {
    await prisma.callTranscript.deleteMany({ where: { call: { tenantId } } })
  } catch {}
  try {
    await prisma.callRecording.deleteMany({ where: { call: { tenantId } } })
  } catch {}
  try {
    await prisma.aICall.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Events
  try {
    await prisma.eventRegistration.deleteMany({ where: { event: { tenantId } } })
  } catch {}
  try {
    await prisma.event.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Websites
  try {
    await prisma.websitePage.deleteMany({ where: { website: { tenantId } } })
  } catch {}
  try {
    await prisma.website.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Landing Pages (already handled above, but keep for safety)
  try {
    await prisma.landingPage.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Checkout Pages
  try {
    await prisma.checkoutPage.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Chatbots
  try {
    await prisma.chatbotConversation.deleteMany({ where: { chatbot: { website: { tenantId } } } })
  } catch {}
  try {
    await prisma.websiteChatbot.deleteMany({ where: { website: { tenantId } } })
  } catch {}
  
  // Social Media
  try {
    await prisma.scheduledPost.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.socialPost.deleteMany({ where: { account: { tenantId } } })
  } catch {}
  try {
    await prisma.socialMediaAccount.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Logos
  try {
    await prisma.logoVariation.deleteMany({ where: { logo: { tenantId } } })
  } catch {}
  try {
    await prisma.logo.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Custom Dashboards & Reports
  try {
    await prisma.customDashboard.deleteMany({ where: { tenantId } })
  } catch {}
  try {
    await prisma.customReport.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Notifications (if model exists)
  try {
    await prisma.notification.deleteMany({ where: { tenantId } })
  } catch {}
  
  // Automation (if model exists)
  try {
    await prisma.automationRun.deleteMany({ where: { tenantId } })
  } catch {}
  
  console.log('✅ All demo business data cleared')
}
