-- Phase C: Marketing Command Center models + campaign spend tracking

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "playbookSlug" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "budgetInr" INTEGER;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "spendInr" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "hardCap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "audienceRef" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "contentRef" TEXT;

CREATE INDEX IF NOT EXISTS "Campaign_tenantId_type_status_idx" ON "Campaign"("tenantId", "type", "status");

CREATE TABLE IF NOT EXISTS "MarketingPost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT,
    "channel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledFor" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "segmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarketingPost_tenantId_idx" ON "MarketingPost"("tenantId");
CREATE INDEX IF NOT EXISTS "MarketingPost_tenantId_channel_idx" ON "MarketingPost"("tenantId", "channel");
CREATE INDEX IF NOT EXISTS "MarketingPost_tenantId_status_idx" ON "MarketingPost"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "MarketingPost_tenantId_scheduledFor_idx" ON "MarketingPost"("tenantId", "scheduledFor");
CREATE INDEX IF NOT EXISTS "MarketingPost_status_scheduledFor_idx" ON "MarketingPost"("status", "scheduledFor");

ALTER TABLE "MarketingPost" DROP CONSTRAINT IF EXISTS "MarketingPost_tenantId_fkey";
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MarketingPlaybook" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goal" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingPlaybook_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketingPlaybook_slug_key" ON "MarketingPlaybook"("slug");
CREATE INDEX IF NOT EXISTS "MarketingPlaybook_tenantId_idx" ON "MarketingPlaybook"("tenantId");
CREATE INDEX IF NOT EXISTS "MarketingPlaybook_tenantId_isActive_idx" ON "MarketingPlaybook"("tenantId", "isActive");

ALTER TABLE "MarketingPlaybook" DROP CONSTRAINT IF EXISTS "MarketingPlaybook_tenantId_fkey";
ALTER TABLE "MarketingPlaybook" ADD CONSTRAINT "MarketingPlaybook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MarketingSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "monthlyBudgetInr" INTEGER,
    "waMonthlyBudgetInr" INTEGER,
    "emailMonthlyBudgetInr" INTEGER,
    "smsMonthlyBudgetInr" INTEGER,
    "dailyContactCap" INTEGER,
    "weeklyContactCap" INTEGER,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketingSettings_tenantId_key" ON "MarketingSettings"("tenantId");
CREATE INDEX IF NOT EXISTS "MarketingSettings_tenantId_idx" ON "MarketingSettings"("tenantId");

ALTER TABLE "MarketingSettings" DROP CONSTRAINT IF EXISTS "MarketingSettings_tenantId_fkey";
ALTER TABLE "MarketingSettings" ADD CONSTRAINT "MarketingSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ChannelAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChannelAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChannelAccount_tenantId_idx" ON "ChannelAccount"("tenantId");
CREATE INDEX IF NOT EXISTS "ChannelAccount_tenantId_type_idx" ON "ChannelAccount"("tenantId", "type");

ALTER TABLE "ChannelAccount" DROP CONSTRAINT IF EXISTS "ChannelAccount_tenantId_fkey";
ALTER TABLE "ChannelAccount" ADD CONSTRAINT "ChannelAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ContentItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL,
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goal" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentItem_tenantId_idx" ON "ContentItem"("tenantId");
CREATE INDEX IF NOT EXISTS "ContentItem_tenantId_type_idx" ON "ContentItem"("tenantId", "type");

ALTER TABLE "ContentItem" DROP CONSTRAINT IF EXISTS "ContentItem_tenantId_fkey";
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_idx" ON "MediaAsset"("tenantId");
CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_type_idx" ON "MediaAsset"("tenantId", "type");

ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_tenantId_fkey";
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ChannelEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "campaignId" TEXT,
    "socialPostId" TEXT,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "ChannelEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChannelEvent_tenantId_idx" ON "ChannelEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "ChannelEvent_tenantId_channelType_eventType_timestamp_idx" ON "ChannelEvent"("tenantId", "channelType", "eventType", "timestamp");

ALTER TABLE "ChannelEvent" DROP CONSTRAINT IF EXISTS "ChannelEvent_tenantId_fkey";
ALTER TABLE "ChannelEvent" ADD CONSTRAINT "ChannelEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SocialActivityEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source" TEXT,
    "platform" TEXT NOT NULL,
    "providerEventId" TEXT,
    "accountId" TEXT,
    "action" TEXT NOT NULL,
    "actorName" TEXT,
    "actorHandle" TEXT,
    "actorAvatar" TEXT,
    "objectType" TEXT,
    "objectId" TEXT,
    "objectText" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SocialActivityEvent_tenantId_idx" ON "SocialActivityEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "SocialActivityEvent_tenantId_platform_idx" ON "SocialActivityEvent"("tenantId", "platform");
CREATE INDEX IF NOT EXISTS "SocialActivityEvent_tenantId_action_idx" ON "SocialActivityEvent"("tenantId", "action");
CREATE INDEX IF NOT EXISTS "SocialActivityEvent_tenantId_eventAt_idx" ON "SocialActivityEvent"("tenantId", "eventAt");
CREATE INDEX IF NOT EXISTS "SocialActivityEvent_tenantId_platform_providerEventId_idx" ON "SocialActivityEvent"("tenantId", "platform", "providerEventId");

ALTER TABLE "SocialActivityEvent" DROP CONSTRAINT IF EXISTS "SocialActivityEvent_tenantId_fkey";
ALTER TABLE "SocialActivityEvent" ADD CONSTRAINT "SocialActivityEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
