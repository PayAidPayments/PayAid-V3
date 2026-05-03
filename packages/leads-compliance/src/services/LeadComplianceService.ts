import { prisma } from '@payaid/db'

export interface ChannelPermissions {
  emailAllowed: boolean
  callAllowed: boolean
  linkedinAllowed: boolean
  exportAllowed: boolean
}

export class LeadComplianceService {
  async canEnrichContact(contactId: string): Promise<boolean> {
    const profile = await prisma.leadConsentProfile.findUnique({ where: { contactId } })
    return !profile?.doNotEnrich
  }

  async canExportContact(contactId: string): Promise<boolean> {
    const profile = await prisma.leadConsentProfile.findUnique({ where: { contactId } })
    return Boolean(profile?.exportAllowed)
  }

  async getChannelPermissions(contactId: string): Promise<ChannelPermissions> {
    const profile = await prisma.leadConsentProfile.findUnique({ where: { contactId } })

    if (!profile) {
      return {
        emailAllowed: false,
        callAllowed: false,
        linkedinAllowed: false,
        exportAllowed: false,
      }
    }

    return {
      emailAllowed: profile.emailAllowed,
      callAllowed: profile.callAllowed,
      linkedinAllowed: profile.linkedinAllowed,
      exportAllowed: profile.exportAllowed,
    }
  }
}
