-- Bridge: optional `Website.linkedLandingPageId` → `LandingPage.id` (one website per landing page).

ALTER TABLE "Website" ADD COLUMN "linkedLandingPageId" TEXT;

CREATE UNIQUE INDEX "Website_linkedLandingPageId_key" ON "Website"("linkedLandingPageId");

CREATE INDEX "Website_linkedLandingPageId_idx" ON "Website"("linkedLandingPageId");

ALTER TABLE "Website" ADD CONSTRAINT "Website_linkedLandingPageId_fkey" FOREIGN KEY ("linkedLandingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
