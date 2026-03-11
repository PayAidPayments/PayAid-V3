'use client'

import { useParams } from 'next/navigation'
import { SpreadsheetEditor } from '@/components/spreadsheet/SpreadsheetEditor'

export default function DashboardSpreadsheetEditorPage() {
  const params = useParams()
  const spreadsheetId = params?.id as string

  if (!spreadsheetId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <SpreadsheetEditor
      spreadsheetId={spreadsheetId}
      backHref="/dashboard/spreadsheets"
      newSpreadsheetHref="/dashboard/spreadsheets/new"
    />
  )
}

