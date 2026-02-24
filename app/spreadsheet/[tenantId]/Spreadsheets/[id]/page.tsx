'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SpreadsheetEditor } from '@/components/spreadsheet/SpreadsheetEditor'

/**
 * Spreadsheet editor page within the spreadsheet module.
 * Keeps the user on /spreadsheet/[tenantId]/Spreadsheets/[id] and renders the shared editor.
 */
export default function SpreadsheetModuleEditorPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const id = params?.id as string

  useEffect(() => {
    if (id === 'new' && tenantId) {
      router.replace(`/spreadsheet/${tenantId}/Spreadsheets/create`)
    }
  }, [id, tenantId, router])

  if (!id || !tenantId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  if (id === 'new') {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500 dark:text-gray-400">
        Redirecting to new spreadsheet...
      </div>
    )
  }

  return (
    <SpreadsheetEditor
      spreadsheetId={id}
      backHref={`/spreadsheet/${tenantId}/Spreadsheets`}
      newSpreadsheetHref={`/spreadsheet/${tenantId}/Spreadsheets/create`}
    />
  )
}
