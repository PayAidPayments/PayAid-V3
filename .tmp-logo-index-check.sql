SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Logo' AND indexname = 'Logo_tenantId_logoType_idx';
