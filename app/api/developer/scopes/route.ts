import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/**
 * GET /api/developer/scopes - List available API scopes
 * Returns all available scopes that can be assigned to API keys
 */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')

    // Define available scopes grouped by module
    const scopes = {
      crm: [
        { value: 'read:contacts', label: 'Read contacts', description: 'View contacts and leads' },
        { value: 'write:contacts', label: 'Create/update contacts', description: 'Create and update contacts' },
        { value: 'read:deals', label: 'Read deals', description: 'View deals and pipeline' },
        { value: 'write:deals', label: 'Create/update deals', description: 'Create and update deals' },
        { value: 'read:tasks', label: 'Read tasks', description: 'View tasks' },
        { value: 'write:tasks', label: 'Create/update tasks', description: 'Create and update tasks' },
      ],
      finance: [
        { value: 'read:invoices', label: 'Read invoices', description: 'View invoices' },
        { value: 'write:invoices', label: 'Create/update invoices', description: 'Create and update invoices' },
        { value: 'read:expenses', label: 'Read expenses', description: 'View expenses' },
        { value: 'write:expenses', label: 'Create/update expenses', description: 'Create and update expenses' },
      ],
      hr: [
        { value: 'read:employees', label: 'Read employees', description: 'View employee data' },
        { value: 'read:attendance', label: 'Read attendance', description: 'View attendance records' },
      ],
      workflow: [
        { value: 'read:workflows', label: 'Read workflows', description: 'View workflow definitions' },
        { value: 'write:workflows', label: 'Create/update workflows', description: 'Create and update workflows' },
        { value: 'run:workflows', label: 'Run workflows', description: 'Manually trigger workflows' },
      ],
      webhook: [
        { value: 'webhook:receive', label: 'Receive webhooks', description: 'Receive webhook events from PayAid' },
      ],
    }

    return NextResponse.json({ scopes })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get scopes' },
      { status: 500 }
    )
  }
}
