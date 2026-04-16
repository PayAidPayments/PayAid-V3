import { getSpecialistById, normalizeModule } from './registry'
import { SpecialistPolicyInput, SpecialistPolicyResult } from './types'

function includesModuleOrWildcard(userModules: string[], module: string): boolean {
  if (userModules.length === 0) return true
  return userModules.includes(module) || userModules.includes('all')
}

function hasElevatedRole(roles: string[]): boolean {
  return roles.some((role) => ['admin', 'owner', 'super_admin', 'manager'].includes(role.toLowerCase()))
}

export function evaluateSpecialistPolicy(input: SpecialistPolicyInput): SpecialistPolicyResult {
  const specialist = getSpecialistById(input.specialistId)
  if (!specialist) {
    return { allowed: false, reason: 'Unknown specialist' }
  }

  const normalizedModule = normalizeModule(input.module)

  if (!specialist.modules.includes(normalizedModule)) {
    return {
      allowed: false,
      reason: `${specialist.name} is not available in module ${normalizedModule}`,
      specialist,
    }
  }

  if (!includesModuleOrWildcard(input.userModules, normalizedModule)) {
    return {
      allowed: false,
      reason: `Module ${normalizedModule} is not subscribed for this tenant`,
      specialist,
    }
  }

  if (!specialist.allowedActionLevels.includes(input.requestedActionLevel)) {
    return {
      allowed: false,
      reason: `${specialist.name} does not support action level ${input.requestedActionLevel}`,
      specialist,
    }
  }

  if ((input.requestedActionLevel === 'guarded_write' || input.requestedActionLevel === 'restricted') && !hasElevatedRole(input.userRoles)) {
    return {
      allowed: false,
      reason: `Role is not allowed to perform ${input.requestedActionLevel} actions`,
      specialist,
    }
  }

  return { allowed: true, specialist }
}

