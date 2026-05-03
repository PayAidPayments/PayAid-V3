import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { getGroqClient } from '@/lib/ai/groq'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    try {
      verifyToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    let groq
    try {
      groq = getGroqClient()
    } catch (e) {
      return NextResponse.json(
        { error: 'AI not configured. Set GROQ_API_KEY in environment.' },
        { status: 503 }
      )
    }

    if (action === 'smart-fill') {
      const { values, count } = body as { values: string[]; count?: number }
      if (!Array.isArray(values) || values.length === 0) {
        return NextResponse.json({ error: 'values array required' }, { status: 400 })
      }
      const fillCount = Math.min(Math.max(Number(count) || 1, 1), 30)
      const prompt = `Analyze this spreadsheet cell sequence and detect the pattern (date daily/weekly/monthly, numbers arithmetic/geometric, categories, IDs like INV-001).
Values: ${JSON.stringify(values.slice(-15))}

Generate exactly ${fillCount} next values following the same pattern. Reply with a JSON array only, e.g. ["val1","val2",...]. No explanation.`
      const raw = await groq.generateCompletion(prompt)
      const arrMatch = raw.match(/\[[\s\S]*\]/)
      if (arrMatch) {
        try {
          const generated = JSON.parse(arrMatch[0]) as string[]
          const cleaned = (Array.isArray(generated) ? generated : []).slice(0, fillCount).map((v) => String(v).trim().replace(/^["']|["']$/g, ''))
          if (cleaned.length > 0) {
            return NextResponse.json({ generated: cleaned })
          }
        } catch {
          /* fallback to single next */
        }
      }
      const singlePrompt = `Given this sequence, suggest the next single value only. Reply with ONLY the value, nothing else.\nValues: ${JSON.stringify(values.slice(-5))}`
      const next = await groq.generateCompletion(singlePrompt)
      const nextVal = next.trim().replace(/^["']|["']$/g, '')
      return NextResponse.json({ generated: [nextVal] })
    }

    if (action === 'formula-suggest') {
      const { headers, sampleRow } = body as { headers: string[]; sampleRow?: string[] }
      if (!Array.isArray(headers)) {
        return NextResponse.json({ error: 'headers array required' }, { status: 400 })
      }
      const prompt = `Spreadsheet column headers: ${headers.join(', ')}.${sampleRow ? ` Sample row: ${sampleRow.join(', ')}.` : ''}
Suggest exactly 3 useful Excel-style formulas for this data. Consider SUM, AVERAGE, SUMIFS, COUNTIF, etc. based on column names (Sales→SUM/AVERAGE, Date→COUNTIFS).
Reply with a JSON array only: [{"formula":"=SUM(B2:B100)","description":"Total sales"}, ...]. No markdown.`
      const raw = await groq.generateCompletion(prompt)
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const arr = JSON.parse(match[0]) as Array<{ formula?: string; description?: string }>
          const suggestions = (Array.isArray(arr) ? arr : []).slice(0, 3).map((s) => ({ formula: s.formula || '', description: s.description || 'Formula' }))
          if (suggestions.length > 0) {
            return NextResponse.json({ suggestions })
          }
        } catch {
          /* fallback */
        }
      }
      const fallback = `Suggest one formula. JSON: {"formula":"=...","description":"..."}. Headers: ${headers.join(', ')}`
      const one = await groq.generateCompletion(fallback)
      const oneMatch = one.match(/\{[\s\S]*\}/)
      if (oneMatch) {
        try {
          const parsed = JSON.parse(oneMatch[0]) as { formula?: string; description?: string }
          return NextResponse.json({ suggestions: [{ formula: parsed.formula || '', description: parsed.description || 'Formula' }] })
        } catch {
          //
        }
      }
      return NextResponse.json({ suggestions: [] })
    }

    if (action === 'chart-recommend') {
      const { dataPreview } = body as { dataPreview: string[][] }
      if (!Array.isArray(dataPreview) || dataPreview.length === 0) {
        return NextResponse.json({ error: 'dataPreview required' }, { status: 400 })
      }
      const preview = dataPreview.slice(0, 6).map((r) => r.join(', ')).join('\n')
      const prompt = `Given this spreadsheet data preview (first rows), which chart type is best: bar, line, or pie? Reply with exactly one word: bar, line, or pie.\nData:\n${preview}`
      const chartType = (await groq.generateCompletion(prompt)).trim().toLowerCase()
      const type = ['bar', 'line', 'pie'].includes(chartType) ? chartType : 'bar'
      return NextResponse.json({ chartType: type })
    }

    if (action === 'clean-data') {
      const { column } = body as { column: string[] }
      if (!Array.isArray(column)) {
        return NextResponse.json({ error: 'column array required' }, { status: 400 })
      }
      const prompt = `Clean this list of values: remove duplicates, trim whitespace, and standardize (e.g. fix inconsistent casing). Reply with a JSON array of the cleaned values only, same order, no explanation. Input: ${JSON.stringify(column.slice(0, 50))}`
      const raw = await groq.generateCompletion(prompt)
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const cleaned = JSON.parse(match[0])
          return NextResponse.json({ cleaned: Array.isArray(cleaned) ? cleaned : column })
        } catch {
          return NextResponse.json({ cleaned: column })
        }
      }
      return NextResponse.json({ cleaned: column })
    }

    if (action === 'nl-query') {
      const { query, headers, dataPreview } = body as { query: string; headers: string[]; dataPreview: string[][] }
      if (!query?.trim()) {
        return NextResponse.json({ error: 'query required' }, { status: 400 })
      }
      const preview = (dataPreview || []).slice(0, 8).map((r) => r.join(', ')).join('\n')
      const prompt = `User asked: "${query}"
Spreadsheet headers: ${(headers || []).join(', ')}
Data preview (first rows):
${preview}

Convert to an Excel action. Reply with JSON only:
- For formulas: {"type":"formula","formula":"=...","description":"...","insertAt":"A1"} (insertAt = cell where to put formula, e.g. D1)
- For direct answer: {"type":"result","result":"answer text"}
- For flagging/conditional: {"type":"formula","formula":"=IF(...)","description":"...","insertAt":"E1"}
Use insertAt as the first data row for new columns (e.g. if headers in row 0, use row 1). No markdown.`
      const raw = await groq.generateCompletion(prompt)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as { type?: string; formula?: string; result?: string; description?: string; insertAt?: string }
          if (parsed.type === 'formula' && parsed.formula) {
            return NextResponse.json({ type: 'formula', formula: parsed.formula, description: parsed.description || '', insertAt: parsed.insertAt || 'A1' })
          }
          if (parsed.type === 'result' || parsed.result) {
            return NextResponse.json({ type: 'result', result: parsed.result || raw.trim() })
          }
          if (parsed.formula) {
            return NextResponse.json({ type: 'formula', formula: parsed.formula, description: parsed.description || '', insertAt: parsed.insertAt || 'A1' })
          }
          return NextResponse.json({ type: 'result', result: parsed.result || raw.trim() })
        } catch {
          return NextResponse.json({ type: 'result', result: raw.trim() })
        }
      }
      return NextResponse.json({ type: 'result', result: raw.trim() })
    }

    if (action === 'insights') {
      const { headers, dataPreview, rowCount } = body as { headers: string[]; dataPreview: string[][]; rowCount?: number }
      const preview = (dataPreview || []).slice(0, 15).map((r) => r.join(' | ')).join('\n')
      const prompt = `Spreadsheet data summary. Headers: ${(headers || []).join(', ')}. Row count: ${rowCount ?? 'unknown'}. First rows:
${preview}

Generate 2-4 short business insights (1 line each), India/₹ context if numbers. Examples: "25 invoices, ₹4.2L total", "Q1 GST filing due Apr 11", "Sales up 15% MoM". Also list 0-3 anomalies (empty amounts, duplicate IDs, odd values). Reply with JSON only: {"insights":["...","..."],"anomalies":["..."]}. No markdown.`
      const raw = await groq.generateCompletion(prompt)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as { insights?: string[]; anomalies?: string[] }
          return NextResponse.json({
            insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
            anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies.slice(0, 5) : [],
          })
        } catch {
          //
        }
      }
      return NextResponse.json({ insights: [], anomalies: [] })
    }

    if (action === 'find-anomalies') {
      const { headers, dataPreview } = body as { headers: string[]; dataPreview: string[][] }
      const preview = (dataPreview || []).slice(0, 20).map((r) => r.join(' | ')).join('\n')
      const prompt = `Spreadsheet data. Headers: ${(headers || []).join(', ')}. Data:
${preview}

Find anomalies: empty required fields (e.g. amount 0 or blank), duplicate IDs, inconsistent dates, typos. Reply with a JSON array of short messages: ["Anomaly 1", "Anomaly 2"]. No markdown. If none, reply [].`
      const raw = await groq.generateCompletion(prompt)
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const anomalies = JSON.parse(match[0]) as string[]
          return NextResponse.json({ anomalies: Array.isArray(anomalies) ? anomalies.slice(0, 10) : [] })
        } catch {
          //
        }
      }
      return NextResponse.json({ anomalies: [] })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Spreadsheets AI error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 500 }
    )
  }
}
