-- Marketing playbooks, settings, campaign budget/playbook fields

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "playbookSlug" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "budgetInr" INTEGER;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "hardCap" BOOLEAN NOT NULL DEFAULT false;

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

INSERT INTO "MarketingPlaybook" ("id","tenantId","name","slug","description","icon","channels","goal","config","isActive","createdAt","updatedAt")
VALUES
 ('mpbk_new_lead_001', NULL, 'New Lead 3-Step Nurture', 'new-lead-3-step', 'WhatsApp intro, email follow-up, WhatsApp reminder.', '🎯', ARRAY['whatsapp','email']::TEXT[], 'leads', '{"steps":[{"offsetHours":0,"channel":"whatsapp","template":"intro"},{"offsetHours":24,"channel":"email","template":"followup"},{"offsetHours":72,"channel":"whatsapp","template":"reminder"}]}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('mpbk_abandon_002', NULL, 'Abandoned Cart Recovery', 'abandoned-cart', 'Email nudge plus WhatsApp for cart abandoners.', '🛒', ARRAY['email','whatsapp']::TEXT[], 'sales', '{"steps":[{"offsetHours":0,"channel":"email","template":"cart_reminder"},{"offsetHours":24,"channel":"whatsapp","template":"cart_wa"}]}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('mpbk_festival_003', NULL, 'Festival Offer Blast', 'festival-offer-blast', 'Multi-channel promo: WhatsApp, SMS, email.', '🎉', ARRAY['whatsapp','sms','email']::TEXT[], 'sales', '{"steps":[{"offsetHours":0,"channel":"whatsapp","template":"festival_wa"},{"offsetHours":2,"channel":"sms","template":"festival_sms"},{"offsetHours":4,"channel":"email","template":"festival_email"}]}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
