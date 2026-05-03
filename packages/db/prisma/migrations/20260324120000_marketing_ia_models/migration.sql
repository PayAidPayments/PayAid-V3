-- Marketing IA: ChannelAccount, ContentItem, MediaAsset, ChannelEvent; Campaign optional refs.

ALTER TABLE "Campaign" ADD COLUMN "audienceRef" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "contentRef" TEXT;

CREATE INDEX "Campaign_tenantId_type_status_idx" ON "Campaign"("tenantId", "type", "status");

CREATE TABLE "ChannelAccount" (
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

CREATE INDEX "ChannelAccount_tenantId_idx" ON "ChannelAccount"("tenantId");
CREATE INDEX "ChannelAccount_tenantId_type_idx" ON "ChannelAccount"("tenantId", "type");

ALTER TABLE "ChannelAccount" ADD CONSTRAINT "ChannelAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentItem" (
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

CREATE INDEX "ContentItem_tenantId_idx" ON "ContentItem"("tenantId");
CREATE INDEX "ContentItem_tenantId_type_idx" ON "ContentItem"("tenantId", "type");

ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MediaAsset" (
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

CREATE INDEX "MediaAsset_tenantId_idx" ON "MediaAsset"("tenantId");
CREATE INDEX "MediaAsset_tenantId_type_idx" ON "MediaAsset"("tenantId", "type");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChannelEvent" (
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

CREATE INDEX "ChannelEvent_tenantId_idx" ON "ChannelEvent"("tenantId");
CREATE INDEX "ChannelEvent_tenantId_channelType_eventType_timestamp_idx" ON "ChannelEvent"("tenantId", "channelType", "eventType", "timestamp");

ALTER TABLE "ChannelEvent" ADD CONSTRAINT "ChannelEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
