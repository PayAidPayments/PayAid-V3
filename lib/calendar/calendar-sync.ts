/**
 * Calendar Sync Service
 * Two-way sync with Google Calendar and Outlook
 */

import { prisma } from '@/lib/db/prisma'
import { OAuth2Client } from 'google-auth-library'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'

export type CalendarProvider = 'google' | 'outlook'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  attendees?: Array<{ email: string; name?: string }>
}

export class CalendarSyncService {
  /**
   * Connect calendar account
   */
  static async connectCalendar(
    tenantId: string,
    userId: string,
    provider: CalendarProvider,
    accessToken: string,
    refreshToken?: string
  ) {
    // Store credentials (encrypted)
    // TODO: Use EncryptionService to encrypt tokens
    const credentials = {
      provider,
      accessToken,
      refreshToken,
      connectedAt: new Date().toISOString(),
    }

    // Check if email account exists for this user
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        tenantId,
        userId,
        provider: provider === 'google' ? 'gmail' : 'outlook',
      },
    })

    if (emailAccount) {
      // Update with calendar credentials
      const existingCredentials = (emailAccount.providerCredentials as any) || {}
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          providerCredentials: {
            ...existingCredentials,
            calendar: credentials,
          } as any,
        },
      })
    } else {
      // Create new email account entry (for calendar only)
      // Note: This is a simplified approach - in production, you might want a separate CalendarAccount model
      await prisma.emailAccount.create({
        data: {
          tenantId,
          userId,
          email: `${provider}@calendar.sync`,
          provider: provider === 'google' ? 'gmail' : 'outlook',
          providerCredentials: {
            calendar: credentials,
          } as any,
          isActive: true,
        },
      })
    }

    return { success: true, message: 'Calendar connected successfully' }
  }

  /**
   * Sync calendar events to CRM meetings
   */
  static async syncCalendarToCRM(
    tenantId: string,
    userId: string,
    provider: CalendarProvider
  ) {
    // Get calendar credentials
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        tenantId,
        userId,
        provider: provider === 'google' ? 'gmail' : 'outlook',
      },
    })

    if (!emailAccount || !emailAccount.providerCredentials) {
      throw new Error('Calendar not connected')
    }

    const credentials = (emailAccount.providerCredentials as any)?.calendar
    if (!credentials) {
      throw new Error('Calendar credentials not found')
    }

    // Fetch events from calendar
    const events = await this.fetchCalendarEvents(provider, credentials.accessToken)

    // Create/update meetings in CRM
    const syncedMeetings = []
    for (const event of events) {
      // Find or create contact from attendees
      let contactId: string | null = null
      if (event.attendees && event.attendees.length > 0) {
        const attendeeEmail = event.attendees[0].email
        let contact = await prisma.contact.findFirst({
          where: {
            tenantId,
            email: attendeeEmail,
          },
        })

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              tenantId,
              name: event.attendees[0].name || attendeeEmail,
              email: attendeeEmail,
              stage: 'prospect',
            },
          })
        }

        contactId = contact.id
      }

      // Create or update meeting
      const meeting = await prisma.appointment.upsert({
        where: {
          // Assuming there's a unique constraint on externalId
          tenantId_externalId: {
            tenantId,
            externalId: event.id,
          },
        },
        create: {
          tenantId,
          contactId,
          title: event.title,
          description: event.description,
          startTime: event.start,
          endTime: event.end,
          location: event.location,
          externalId: event.id,
          source: provider,
        },
        update: {
          title: event.title,
          description: event.description,
          startTime: event.start,
          endTime: event.end,
          location: event.location,
        },
      })

      syncedMeetings.push(meeting)
    }

    return {
      success: true,
      synced: syncedMeetings.length,
      meetings: syncedMeetings,
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  private static async fetchCalendarEvents(
    provider: CalendarProvider,
    accessToken: string
  ): Promise<CalendarEvent[]> {
    if (provider === 'google') {
      return this.fetchGoogleCalendarEvents(accessToken)
    } else {
      return this.fetchOutlookCalendarEvents(accessToken)
    }
  }

  /**
   * Fetch Google Calendar events
   */
  private static async fetchGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
    // TODO: Implement Google Calendar API call
    // Using googleapis library
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events')
    }

    const data = await response.json()
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.summary || 'No title',
      start: new Date(item.start.dateTime || item.start.date),
      end: new Date(item.end.dateTime || item.end.date),
      description: item.description,
      location: item.location,
      attendees: item.attendees?.map((a: any) => ({
        email: a.email,
        name: a.displayName,
      })),
    }))
  }

  /**
   * Fetch Outlook Calendar events
   */
  private static async fetchOutlookCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
    // TODO: Implement Microsoft Graph API call
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${new Date().toISOString()}'&$top=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Outlook Calendar events')
    }

    const data = await response.json()
    return data.value.map((item: any) => ({
      id: item.id,
      title: item.subject || 'No title',
      start: new Date(item.start.dateTime),
      end: new Date(item.end.dateTime),
      description: item.body?.content,
      location: item.location?.displayName,
      attendees: item.attendees?.map((a: any) => ({
        email: a.emailAddress.address,
        name: a.emailAddress.name,
      })),
    }))
  }

  /**
   * Create meeting in calendar from CRM
   */
  static async createMeetingInCalendar(
    tenantId: string,
    userId: string,
    provider: CalendarProvider,
    meeting: {
      title: string
      start: Date
      end: Date
      description?: string
      location?: string
      attendeeEmails: string[]
    }
  ) {
    // Get calendar credentials
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        tenantId,
        userId,
        provider: provider === 'google' ? 'gmail' : 'outlook',
      },
    })

    if (!emailAccount || !emailAccount.providerCredentials) {
      throw new Error('Calendar not connected')
    }

    const credentials = (emailAccount.providerCredentials as any)?.calendar
    if (!credentials) {
      throw new Error('Calendar credentials not found')
    }

    // Create event in calendar
    if (provider === 'google') {
      return this.createGoogleCalendarEvent(credentials.accessToken, meeting)
    } else {
      return this.createOutlookCalendarEvent(credentials.accessToken, meeting)
    }
  }

  /**
   * Create Google Calendar event
   */
  private static async createGoogleCalendarEvent(accessToken: string, meeting: any) {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: meeting.title,
          description: meeting.description,
          location: meeting.location,
          start: {
            dateTime: meeting.start.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: meeting.end.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          attendees: meeting.attendeeEmails.map((email: string) => ({ email })),
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to create Google Calendar event')
    }

    return await response.json()
  }

  /**
   * Create Outlook Calendar event
   */
  private static async createOutlookCalendarEvent(accessToken: string, meeting: any) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: meeting.title,
        body: {
          contentType: 'HTML',
          content: meeting.description || '',
        },
        start: {
          dateTime: meeting.start.toISOString(),
          timeZone: 'India Standard Time',
        },
        end: {
          dateTime: meeting.end.toISOString(),
          timeZone: 'India Standard Time',
        },
        location: {
          displayName: meeting.location || '',
        },
        attendees: meeting.attendeeEmails.map((email: string) => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        })),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create Outlook Calendar event')
    }

    return await response.json()
  }
}
