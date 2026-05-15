import type { Prisma } from '@prisma/client'

/** Narrow values for Prisma `Json` / `InputJsonValue` fields (strict client typing). */
export function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}
