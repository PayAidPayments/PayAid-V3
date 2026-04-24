import { Client } from 'pg'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const databaseUrl = process.env.DATABASE_URL || ''

if (!databaseUrl) {
  console.error('DATABASE_URL is missing')
  process.exit(1)
}

const statements = [
  `CREATE TABLE IF NOT EXISTS "EmailSendJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "toEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "ccEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "bccEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT,
    "textBody" TEXT,
    "replyTo" TEXT,
    "campaignId" TEXT,
    "contactId" TEXT,
    "dealId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "trackingId" TEXT,
    "eventType" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailSendJob_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "EmailTrackingEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "messageId" TEXT,
    "contactId" TEXT,
    "campaignId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailTrackingEvent_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "EmailSyncCheckpoint" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageId" TEXT,
    "syncToken" TEXT,
    "syncCursor" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailSyncCheckpoint_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "EmailDeliverabilityLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sendingDomain" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DECIMAL(6,3),
    "complaintRate" DECIMAL(6,3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailDeliverabilityLog_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "EmailCampaignSenderPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "senderAccountId" TEXT,
    "senderDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailCampaignSenderPolicy_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE INDEX IF NOT EXISTS "EmailSendJob_tenantId_idx" ON "EmailSendJob" ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "EmailSendJob_tenantId_status_idx" ON "EmailSendJob" ("tenantId", "status")`,
  `CREATE INDEX IF NOT EXISTS "EmailSendJob_accountId_status_idx" ON "EmailSendJob" ("accountId", "status")`,
  `CREATE INDEX IF NOT EXISTS "EmailSendJob_campaignId_idx" ON "EmailSendJob" ("campaignId")`,
  `CREATE INDEX IF NOT EXISTS "EmailSendJob_contactId_idx" ON "EmailSendJob" ("contactId")`,
  `CREATE INDEX IF NOT EXISTS "EmailSendJob_scheduledFor_idx" ON "EmailSendJob" ("scheduledFor")`,
  `CREATE INDEX IF NOT EXISTS "EmailSendJob_createdAt_idx" ON "EmailSendJob" ("createdAt")`,

  `CREATE INDEX IF NOT EXISTS "EmailTrackingEvent_tenantId_idx" ON "EmailTrackingEvent" ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "EmailTrackingEvent_trackingId_idx" ON "EmailTrackingEvent" ("trackingId")`,
  `CREATE INDEX IF NOT EXISTS "EmailTrackingEvent_messageId_idx" ON "EmailTrackingEvent" ("messageId")`,
  `CREATE INDEX IF NOT EXISTS "EmailTrackingEvent_campaignId_eventType_idx" ON "EmailTrackingEvent" ("campaignId", "eventType")`,
  `CREATE INDEX IF NOT EXISTS "EmailTrackingEvent_contactId_eventType_idx" ON "EmailTrackingEvent" ("contactId", "eventType")`,
  `CREATE INDEX IF NOT EXISTS "EmailTrackingEvent_occurredAt_idx" ON "EmailTrackingEvent" ("occurredAt")`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "EmailSyncCheckpoint_accountId_key" ON "EmailSyncCheckpoint" ("accountId")`,
  `CREATE INDEX IF NOT EXISTS "EmailSyncCheckpoint_provider_idx" ON "EmailSyncCheckpoint" ("provider")`,
  `CREATE INDEX IF NOT EXISTS "EmailSyncCheckpoint_lastSyncAt_idx" ON "EmailSyncCheckpoint" ("lastSyncAt")`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "EmailDeliverabilityLog_tenantId_sendingDomain_reportDate_key" ON "EmailDeliverabilityLog" ("tenantId", "sendingDomain", "reportDate")`,
  `CREATE INDEX IF NOT EXISTS "EmailDeliverabilityLog_tenantId_idx" ON "EmailDeliverabilityLog" ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "EmailDeliverabilityLog_sendingDomain_idx" ON "EmailDeliverabilityLog" ("sendingDomain")`,
  `CREATE INDEX IF NOT EXISTS "EmailDeliverabilityLog_reportDate_idx" ON "EmailDeliverabilityLog" ("reportDate")`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "EmailCampaignSenderPolicy_campaignId_key" ON "EmailCampaignSenderPolicy" ("campaignId")`,
  `CREATE INDEX IF NOT EXISTS "EmailCampaignSenderPolicy_tenantId_idx" ON "EmailCampaignSenderPolicy" ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "EmailCampaignSenderPolicy_senderAccountId_idx" ON "EmailCampaignSenderPolicy" ("senderAccountId")`,
]

const client = new Client({ connectionString: databaseUrl })

try {
  await client.connect()
  for (const sql of statements) {
    await client.query(sql)
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        statementsExecuted: statements.length,
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await client.end().catch(() => undefined)
}

