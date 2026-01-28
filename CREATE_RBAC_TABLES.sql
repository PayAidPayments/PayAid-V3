-- Create RBAC Tables Manually
-- Run this FIRST before initializing roles
-- This creates all the RBAC tables needed for Phase 1

-- 1. Create Role table
CREATE TABLE IF NOT EXISTS "Role" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  description TEXT,
  "roleType" TEXT DEFAULT 'custom',
  permissions JSONB DEFAULT '[]',
  "isSystem" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  UNIQUE("tenantId", "roleName")
);

-- 2. Create UserRole table
CREATE TABLE IF NOT EXISTS "UserRole" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "assignedById" TEXT,
  "assignedAt" TIMESTAMP DEFAULT NOW(),
  "expiresAt" TIMESTAMP,
  department TEXT,
  "teamId" TEXT,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT "UserRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
  CONSTRAINT "UserRole_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"(id),
  UNIQUE("tenantId", "userId", "roleId")
);

-- 3. Create Permission table
CREATE TABLE IF NOT EXISTS "Permission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "permissionCode" TEXT NOT NULL,
  description TEXT,
  "moduleName" TEXT NOT NULL,
  action TEXT,
  "isSystem" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "Permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  UNIQUE("tenantId", "permissionCode")
);

-- 4. Create RolePermission table
CREATE TABLE IF NOT EXISTS "RolePermission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "RolePermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"(id) ON DELETE CASCADE,
  UNIQUE("tenantId", "roleId", "permissionId")
);

-- 5. Create UserPermission table
CREATE TABLE IF NOT EXISTS "UserPermission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "permissionCode" TEXT NOT NULL,
  "grantedById" TEXT,
  "grantedAt" TIMESTAMP DEFAULT NOW(),
  "expiresAt" TIMESTAMP,
  reason TEXT,
  CONSTRAINT "UserPermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"(id) ON DELETE CASCADE,
  CONSTRAINT "UserPermission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"(id),
  UNIQUE("tenantId", "userId", "permissionCode")
);

-- 6. Create ModuleAccess table
CREATE TABLE IF NOT EXISTS "ModuleAccess" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "moduleName" TEXT NOT NULL,
  "canView" BOOLEAN DEFAULT false,
  "canCreate" BOOLEAN DEFAULT false,
  "canEdit" BOOLEAN DEFAULT false,
  "canDelete" BOOLEAN DEFAULT false,
  "canAdmin" BOOLEAN DEFAULT false,
  "visibleFields" JSONB DEFAULT '[]',
  "editableFields" JSONB DEFAULT '[]',
  "viewScope" TEXT DEFAULT 'own',
  "editScope" TEXT DEFAULT 'own',
  "customFilters" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "ModuleAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT "ModuleAccess_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
  UNIQUE("tenantId", "roleId", "moduleName")
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_Role_tenantId" ON "Role"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_Role_roleType" ON "Role"("roleType");
CREATE INDEX IF NOT EXISTS "idx_UserRole_tenantId_userId" ON "UserRole"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "idx_UserRole_roleId" ON "UserRole"("roleId");
CREATE INDEX IF NOT EXISTS "idx_UserRole_expiresAt" ON "UserRole"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_Permission_tenantId" ON "Permission"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_Permission_moduleName" ON "Permission"("moduleName");
CREATE INDEX IF NOT EXISTS "idx_Permission_permissionCode" ON "Permission"("permissionCode");
CREATE INDEX IF NOT EXISTS "idx_RolePermission_tenantId_roleId" ON "RolePermission"("tenantId", "roleId");
CREATE INDEX IF NOT EXISTS "idx_RolePermission_permissionId" ON "RolePermission"("permissionId");
CREATE INDEX IF NOT EXISTS "idx_UserPermission_tenantId_userId" ON "UserPermission"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "idx_UserPermission_permissionId" ON "UserPermission"("permissionId");
CREATE INDEX IF NOT EXISTS "idx_UserPermission_expiresAt" ON "UserPermission"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_ModuleAccess_tenantId_roleId" ON "ModuleAccess"("tenantId", "roleId");
CREATE INDEX IF NOT EXISTS "idx_ModuleAccess_moduleName" ON "ModuleAccess"("moduleName");

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RBAC tables created successfully!';
END $$;
