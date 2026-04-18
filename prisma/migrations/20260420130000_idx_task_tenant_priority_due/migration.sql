-- Faster CRM task list: WHERE "tenantId" = ? ORDER BY "priority" DESC, "dueDate" ASC
CREATE INDEX IF NOT EXISTS "idx_task_tenant_priority_due" ON "Task" ("tenantId", "priority", "dueDate");
