-- ChannelEvent: per-contact caps + optional recorded cost per send
ALTER TABLE "ChannelEvent" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "ChannelEvent" ADD COLUMN IF NOT EXISTS "costInr" INTEGER;

CREATE INDEX IF NOT EXISTS "ChannelEvent_tenantId_contactId_timestamp_idx"
  ON "ChannelEvent"("tenantId", "contactId", "timestamp");
