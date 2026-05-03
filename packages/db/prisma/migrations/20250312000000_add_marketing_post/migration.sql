-- CreateTable
CREATE TABLE "MarketingPost" (
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

-- CreateIndex
CREATE INDEX "MarketingPost_tenantId_idx" ON "MarketingPost"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingPost_tenantId_channel_idx" ON "MarketingPost"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "MarketingPost_tenantId_status_idx" ON "MarketingPost"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketingPost_tenantId_scheduledFor_idx" ON "MarketingPost"("tenantId", "scheduledFor");

-- CreateIndex
CREATE INDEX "MarketingPost_status_scheduledFor_idx" ON "MarketingPost"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
