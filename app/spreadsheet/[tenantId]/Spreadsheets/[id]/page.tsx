'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Spreadsheet editor lives at /dashboard/spreadsheets/[id] (shared Handsontable editor).
 * Redirect so we don't duplicate the editor; user returns to spreadsheet module list via back.
 */
export default function SpreadsheetEditorRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  useEffect(() => {
    if (id && id !== 'new') {
      router.replace(`/dashboard/spreadsheets/${id}`)
    }
  }, [id, router])

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-gray-500 dark:text-gray-400">
      Opening spreadsheet...
    </div>
  )
}
