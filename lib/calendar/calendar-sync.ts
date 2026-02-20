/**
 * Calendar Sync Service
 * Two-way sync with Google Calendar and Outlook
 * Optional deps: google-auth-library, @microsoft/microsoft-graph-client, @azure/identity
 */

import { prisma } from '@/lib/db/prisma'

// Optional: only used when calendar providers are needed
// These modules may not be installed - using type-only declarations
// @ts-ignore - Optional dependency
type OAuth2Client = any
// @ts-ignore - Optional dependency  
type MicrosoftGraphClient = any
// @ts-ignore - Optional dependency
type TokenCredentialAuthenticationProvider = any
// @ts-ignore - Optional dependency
type ClientSecretCredential = any

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
          password: '', // Required by schema; calendar-only accounts don't use it
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

      // Map event times to Appointment schema (appointmentDate, startTime/endTime as HH:mm)
      const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start
      const endDate = typeof event.end === 'string' ? new Date(event.end) : event.end
      const startTimeStr = startDate.toTimeString().slice(0, 5) // HH:mm
      const endTimeStr = endDate.toTimeString().slice(0, 5)

      const existing = await prisma.appointment.findFirst({
        where: {
          tenantId,
          contactId: contactId ?? undefined,
          appointmentDate: startDate,
          startTime: startTimeStr,
        },
      })

      const meeting = existing
        ? await prisma.appointment.update({
            where: { id: existing.id },
            data: {
              notes: event.description ?? existing.notes,
              endTime: endTimeStr,
              location: event.location ?? existing.location,
              updatedAt: new Date(),
            },
          })
        : await prisma.appointment.create({
            data: {
              tenantId,
              contactId,
              contactName: event.attendees?.[0]?.name ?? 'Calendar',
              contactEmail: event.attendees?.[0]?.email ?? undefined,
              appointmentDate: startDate,
              startTime: startTimeStr,
              endTime: endTimeStr,
              location: event.location ?? null,
              notes: event.description ?? null,
              type: 'MEETING',
              status: 'SCHEDULED',
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
