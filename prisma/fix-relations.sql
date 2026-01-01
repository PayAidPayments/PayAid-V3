-- This file documents the missing relations that need to be added
-- The relations are already in the Tenant model, but Prisma validation is failing
-- This is likely due to the order of model definitions

-- Missing relations to add:
-- 1. Tenant.assetMaintenance -> AssetMaintenance.tenant (already exists in Tenant model line ~179)
-- 2. User.helpCenterArticles -> HelpCenterArticle.author (needs relation name "HelpCenterArticleAuthor")
-- 3. Product.inventoryLocations -> InventoryLocation.product (needs to be added)
-- 4. Product.stockTransfers -> StockTransfer.product (needs to be added)
-- 5. Product.batchSerials -> BatchSerial.product (needs to be added)
-- 6. Tenant.contracts -> Contract.tenant (already exists in Tenant model)
-- 7. Tenant.workOrders -> WorkOrder.tenant (already exists in Tenant model)

-- All relations are defined in the schema, but Prisma needs them in the correct order
-- Run: npx prisma format to auto-fix the schema

