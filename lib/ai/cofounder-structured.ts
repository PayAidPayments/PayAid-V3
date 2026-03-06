/**
 * Structured output types for AI Co-founder: artifacts and inline actions.
 * Used by the cofounder API and the Cofounder page for Artifacts panel + action buttons.
 */

export type ArtifactType = 'table' | 'checklist' | 'chart'

export interface TableArtifactData {
  columns: string[]
  rows: Record<string, string | number>[]
}

export interface ChecklistArtifactData {
  items: { label: string; done?: boolean }[]
}

export interface ChartArtifactData {
  type: 'bar' | 'line'
  title?: string
  labels: string[]
  datasets: { label: string; values: number[] }[]
}

export type ArtifactData = TableArtifactData | ChecklistArtifactData | ChartArtifactData

export interface ArtifactPayload {
  type: ArtifactType
  data: ArtifactData
  title?: string
}

/** Action types that can be rendered as inline buttons */
export type StructuredActionType =
  | 'open_crm'
  | 'open_finance'
  | 'open_hr'
  | 'open_deal'
  | 'open_invoice'
  | 'create_task'
  | 'open_quotes'

export interface StructuredAction {
  type: StructuredActionType
  /** For open_deal */
  dealId?: string
  /** For open_invoice */
  invoiceId?: string
  /** For create_task */
  title?: string
  description?: string
  due?: string
  priority?: 'low' | 'medium' | 'high'
  /** Human-readable label for the button */
  label?: string
}

export interface CofounderStructuredBlock {
  /** Short summary to show if we replace message with this */
  summary?: string
  artifact_type: ArtifactType | null
  artifact_data: ArtifactData | null
  artifact_title?: string
  actions: StructuredAction[]
}

const STRUCTURED_MARKER_START = 'PAYAID_STRUCTURED'
const STRUCTURED_MARKER_END = 'PAYAID_STRUCTURED_END'

/**
 * Extract and parse a PAYAID_STRUCTURED ... PAYAID_STRUCTURED_END block from LLM response.
 * Returns { cleanMessage, structured } or { cleanMessage: raw, structured: null } on failure.
 */
export function parseStructuredBlock(raw: string): {
  cleanMessage: string
  structured: CofounderStructuredBlock | null
} {
  const startIdx = raw.indexOf(STRUCTURED_MARKER_START)
  if (startIdx === -1) {
    return { cleanMessage: raw.trim(), structured: null }
  }
  const afterStart = raw.indexOf('\n', startIdx) + 1
  const endIdx = raw.indexOf(STRUCTURED_MARKER_END, afterStart)
  if (endIdx === -1) {
    return { cleanMessage: raw.trim(), structured: null }
  }
  const jsonStr = raw.slice(afterStart, endIdx).trim()
  let structured: CofounderStructuredBlock
  try {
    structured = JSON.parse(jsonStr) as CofounderStructuredBlock
  } catch {
    return { cleanMessage: raw.trim(), structured: null }
  }
  const before = raw.slice(0, startIdx).trim()
  const after = raw.slice(endIdx + STRUCTURED_MARKER_END.length).trim()
  const cleanMessage = [before, after].filter(Boolean).join('\n\n').trim() || structured.summary || raw.trim()
  if (!structured.actions) structured.actions = []
  if (!structured.artifact_type) structured.artifact_data = null
  if (!structured.artifact_data) structured.artifact_type = null
  return { cleanMessage, structured }
}

/** Match markdown table: lines with | ... | (header, optional separator, data rows) */
const MARKDOWN_TABLE_LINE = /^\s*\|(.+)\|\s*$/
const MARKDOWN_TABLE_SEPARATOR = /^\s*\|[\s\-:|]+\|\s*$/

/**
 * Parse the first markdown table found in text into TableArtifactData.
 * Handles | Col1 | Col2 | header and | a | b | rows; skips | --- | --- | separator.
 * Returns null if no valid table is found.
 */
export function parseMarkdownTable(text: string): TableArtifactData | null {
  const lines = text.split(/\r?\n/)
  let headerCells: string[] | null = null
  const rows: Record<string, string | number>[] = []

  for (const line of lines) {
    const pipeMatch = line.match(MARKDOWN_TABLE_LINE)
    if (!pipeMatch) continue

    const cellStr = pipeMatch[1]
    const cells = cellStr.split('|').map((c) => c.trim())

    // Skip separator line (e.g. | --- | --- |)
    if (MARKDOWN_TABLE_SEPARATOR.test(line)) continue

    if (headerCells === null) {
      if (cells.length >= 2 && cells.some(Boolean)) {
        headerCells = cells.filter(Boolean)
      }
      continue
    }

    if (cells.length >= 2 && headerCells.length >= 1) {
      const row: Record<string, string | number> = {}
      headerCells.forEach((col, i) => {
        const raw = cells[i] ?? ''
        const num = Number(raw.replace(/[₹,\s]/g, ''))
        row[col] = Number.isNaN(num) ? raw : num
      })
      rows.push(row)
    }
  }

  if (!headerCells || headerCells.length === 0 || rows.length === 0) return null
  return { columns: headerCells, rows }
}

/** System prompt snippet instructing the LLM to optionally emit the structured block */
export const STRUCTURED_OUTPUT_INSTRUCTION = `
When your response includes:
- Tabular data (e.g. pipeline deals, top customers, invoice list): emit a table artifact.
- A list of actionable items with checkboxes: emit a checklist artifact.
- Specific next steps the user can take in the app (open a deal, create a task, go to CRM): emit actions.

You MAY append a structured block so the app can show interactive outputs and action buttons. Use this exact format (no markdown around it):
${STRUCTURED_MARKER_START}
{"summary":"Brief 1-2 sentence summary","artifact_type":"table"|"checklist"|"chart"|null,"artifact_data":{...}|null,"artifact_title":"Optional title","actions":[{"type":"open_crm"|"open_deal"|"open_finance"|"open_hr"|"create_task"|"open_invoice"|"open_quotes","dealId":"...","invoiceId":"...","title":"...","description":"...","due":"YYYY-MM-DD","priority":"low"|"medium"|"high","label":"Button text"}]}
${STRUCTURED_MARKER_END}

Rules:
- For tables: artifact_type "table", artifact_data: {"columns":["Col1","Col2"],"rows":[{"Col1":"a","Col2":1},...]}.
- For checklists: artifact_type "checklist", artifact_data: {"items":[{"label":"Item 1","done":false},...]}.
- For actions: use type "open_deal" with "dealId" when you reference a specific deal; "create_task" with "title","description","due","priority"; "open_crm"/"open_finance"/"open_hr" for navigation. Include "label" for button text.
- If no tabular/checklist data or no concrete in-app actions, omit the block or use null for artifact_type and [] for actions.
- Currency must be in INR (₹). Do not use $.
- Spell brand names correctly: LinkedIn (not "Linked in"), WhatsApp, Facebook, Instagram, etc.
`
