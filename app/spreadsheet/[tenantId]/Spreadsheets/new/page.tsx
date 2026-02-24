'use client'

import { NewSpreadsheetForm } from '@/components/spreadsheet/NewSpreadsheetForm'

/**
 * /Spreadsheets/new — renders the same New Spreadsheet form as /create
 * so this URL stays in the spreadsheet module and never goes to the dashboard.
 */
export default function NewSpreadsheetPage() {
  return <NewSpreadsheetForm />
}
