/**
 * @payaid/core – Shared auth/tenant/stores/modules (Phase 4), feature flags (Phase 10).
 */
export const CORE_PACKAGE = '@payaid/core'
export {
  MODULE_REGISTRY,
  getEnabledModules,
  getAccessibleRoutes,
  hasModuleAccess,
  hasModule,
  getModule,
  getAllModules,
  getModulesByCategory,
  type ModuleRoute,
  type ModuleDefinition,
  type ModuleId,
} from './moduleRegistry'
export {
  getFeatureFlags,
  isFeatureEnabled,
  resetFeatureFlags,
  type FeatureFlags,
} from './flags'
