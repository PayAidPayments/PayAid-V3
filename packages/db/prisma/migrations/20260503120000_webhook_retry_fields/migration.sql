-- Webhook retry queue: optional metadata + last failure timestamp (lib/webhooks/retry-queue.ts).
ALTER TABLE "Webhook" ADD COLUMN "lastFailureAt" TIMESTAMP(3);
ALTER TABLE "Webhook" ADD COLUMN "metadata" JSONB;
