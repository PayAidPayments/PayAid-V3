/**
 * @payaid/db – Shared Prisma client for PayAid Turborepo apps.
 * Use prisma or prismaExtended (when Accelerate URL is set) in server code only.
 */

export { prisma, default as defaultPrisma } from './client'
export { prismaExtended, default as defaultExtended } from './extended'
