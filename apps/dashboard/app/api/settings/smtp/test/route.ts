import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/encryption'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { captureIntegrationError, enforceIntegrationRateLimit } from '@/lib/integrations/security'
import net from 'net'
import tls from 'tls'

const bodySchema = z.object({
  to: z.string().email(),
})

function readSmtpLine(socket: net.Socket | tls.TLSSocket) {
  return new Promise<string>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      cleanup()
      resolve(text)
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const onClose = () => {
      cleanup()
      reject(new Error('SMTP socket closed unexpectedly'))
    }
    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
      socket.off('close', onClose)
    }
    socket.on('data', onData)
    socket.on('error', onError)
    socket.on('close', onClose)
  })
}

async function smtpCommand(socket: net.Socket | tls.TLSSocket, command: string, expectedCodes: string[]) {
  socket.write(`${command}\r\n`)
  const response = await readSmtpLine(socket)
  const code = response.slice(0, 3)
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed (${command.split(' ')[0]}): ${response.trim()}`)
  }
  return response
}

async function sendSmtpTestEmail(options: {
  host: string
  port: number
  useTls: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
  to: string
}) {
  const socket = (options.useTls
    ? tls.connect({ host: options.host, port: options.port, servername: options.host })
    : net.connect({ host: options.host, port: options.port })) as net.Socket | tls.TLSSocket

  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve())
    socket.once('error', (err) => reject(err))
  })

  const closeSocket = () => {
    try {
      socket.end()
      socket.destroy()
    } catch {
      // no-op
    }
  }

  try {
    const greet = await readSmtpLine(socket)
    if (!greet.startsWith('220')) throw new Error(`SMTP server did not greet properly: ${greet.trim()}`)

    await smtpCommand(socket, `EHLO payaid.local`, ['250'])
    await smtpCommand(socket, 'AUTH LOGIN', ['334'])
    await smtpCommand(socket, Buffer.from(options.username, 'utf8').toString('base64'), ['334'])
    await smtpCommand(socket, Buffer.from(options.password, 'utf8').toString('base64'), ['235'])
    await smtpCommand(socket, `MAIL FROM:<${options.fromEmail}>`, ['250'])
    await smtpCommand(socket, `RCPT TO:<${options.to}>`, ['250', '251'])
    await smtpCommand(socket, 'DATA', ['354'])

    const subject = `PayAid SMTP test - ${new Date().toISOString()}`
    const body = [
      `From: "${options.fromName}" <${options.fromEmail}>`,
      `To: <${options.to}>`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'This is a PayAid SMTP integration test email.',
      `Tenant sender: ${options.fromEmail}`,
      `Sent at: ${new Date().toISOString()}`,
      '',
      'If you received this, your SMTP settings are working.',
      '.',
    ].join('\r\n')
    await smtpCommand(socket, body, ['250'])
    await smtpCommand(socket, 'QUIT', ['221'])
  } finally {
    closeSocket()
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:smtp:test',
    limit: 5,
    windowMs: 60_000,
  })
  if (limited) return limited

  let actor: { tenantId: string; userId: string | null | undefined } | null = null

  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    actor = { tenantId: user.tenantId, userId: user.userId }
    await assertIntegrationPermission(request, 'configure')

    const body = bodySchema.parse(await request.json())

    const settings = await (prisma as any).tenantSmtpSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (!settings?.isConfigured || !settings.host || !settings.username || !settings.passwordEnc) {
      return NextResponse.json({ error: 'SMTP is not configured' }, { status: 400 })
    }

    // Validate secret format and correct ENCRYPTION_KEY without returning secrets.
    const smtpPassword = decrypt(settings.passwordEnc)
    const fromEmail = settings.fromEmail || settings.username
    if (!fromEmail || !String(fromEmail).includes('@')) {
      return NextResponse.json(
        { error: 'Configure a valid sender email (fromEmail or username) before sending a test email.' },
        { status: 400 }
      )
    }

    await sendSmtpTestEmail({
      host: settings.host,
      port: Number(settings.port || 587),
      useTls: Boolean(settings.useTls),
      username: settings.username,
      password: smtpPassword,
      fromEmail: String(fromEmail),
      fromName: settings.fromName || 'PayAid',
      to: body.to,
    })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_smtp',
      entityId: user.tenantId,
      action: 'smtp_test_validated',
      after: { ok: true, recipient: body.to, transport: 'smtp_direct' },
    })

    return NextResponse.json({
      ok: true,
      message: `SMTP test email sent successfully to ${body.to}`,
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json(
        { error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' },
        { status: 500 }
      )
    }
    if (message.includes('Invalid encrypted data format')) {
      return NextResponse.json(
        { error: 'Stored SMTP secret format is invalid. Re-enter SMTP password and save again.' },
        { status: 400 }
      )
    }

    await captureIntegrationError({
      scope: 'smtp_test',
      tenantId: actor?.tenantId,
      userId: actor?.userId,
      error,
    })
    return NextResponse.json({ error: 'Failed to send SMTP test email' }, { status: 500 })
  }
}

