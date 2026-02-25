/**
 * Production-ready spreadsheet templates for PayAid.
 * Data is in sheet format with rows (formulas + values); converted to x-spreadsheet JSON for loadData().
 */

export interface TemplateSheet {
  name: string
  rows: (string | number)[][]
  cellStyles?: Record<string, { bold?: boolean; bgColor?: string; color?: string; numberFormat?: string }>
  conditionalFormats?: Array<{ range: string; type: string; minColor?: string; maxColor?: string }>
  charts?: Array<{ type: string; title: string; dataRange: string; position: { row: number; col: number } }>
}

export interface TemplateData {
  sheets: TemplateSheet[]
  charts?: Array<{ type: string; title: string; dataRange: string; position: { row: number; col: number } }>
}

export interface ProductionTemplate {
  id: string
  name: string
  category: string
  description: string
  previewImage?: string
  data: TemplateData
}

/** Convert template data to x-spreadsheet loadData() format */
export function templateDataToXSpreadsheet(data: TemplateData): Record<string, unknown>[] {
  return data.sheets.map((sheet) => {
    const rows: Record<string, { cells: Record<string, { text: string }> }> = {}
    ;(sheet.rows || []).forEach((row, ri) => {
      const cells: Record<string, { text: string }> = {}
      row.forEach((cell, ci) => {
        const text = cell != null ? String(cell) : ''
        if (text.trim() !== '') cells[ci] = { text }
      })
      if (Object.keys(cells).length > 0) rows[ri] = { cells }
    })
    return { name: sheet.name || 'Sheet1', rows }
  })
}

export function getProductionTemplateById(id: string): ProductionTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

const TEMPLATES: ProductionTemplate[] = [
  {
    id: 'gst-invoice-log',
    name: 'GST Invoice Log',
    category: 'Finance',
    description: 'Track invoices with GST calculations and monthly summary',
    previewImage: 'https://placehold.co/320x200/8b5cf6/white?text=GST+Invoice+Log',
    data: {
      sheets: [
        {
          name: 'Invoices',
          rows: [
            ['Invoice No', 'Date', 'Client', 'Amount', 'GST%', 'CGST', 'SGST', 'Total'],
            ['INV-001', '2026-02-01', 'ABC Corp', 50000, '18%', '=D2*0.09', '=D2*0.09', '=D2+F2+G2'],
            ['INV-002', '2026-02-05', 'XYZ Ltd', 75000, '18%', '=D3*0.09', '=D3*0.09', '=D3+F3+G3'],
            ['INV-003', '2026-02-10', 'Demo Business', 25000, '12%', '=D4*0.06', '=D4*0.06', '=D4+F4+G4'],
            ['INV-004', '2026-02-15', 'Sharptech', 120000, '18%', '=D5*0.09', '=D5*0.09', '=D5+F5+G5'],
            ['INV-005', '2026-02-18', 'Metro Traders', 45000, '18%', '=D6*0.09', '=D6*0.09', '=D6+F6+G6'],
            ['INV-006', '2026-02-20', 'Prime Services', 95000, '18%', '=D7*0.09', '=D7*0.09', '=D7+F7+G7'],
            ['INV-007', '2026-02-22', 'Sunrise Enterprises', 62000, '18%', '=D8*0.09', '=D8*0.09', '=D8+F8+G8'],
            ['INV-008', '2026-02-24', 'Delta Manufacturing', 110000, '18%', '=D9*0.09', '=D9*0.09', '=D9+F9+G9'],
            ['INV-009', '2026-02-26', 'Pioneer Logistics', 78000, '18%', '=D10*0.09', '=D10*0.09', '=D10+F10+G10'],
            ['INV-010', '2026-02-28', 'Summit Retail', 55000, '18%', '=D11*0.09', '=D11*0.09', '=D11+F11+G11'],
            ['INV-011', '2026-03-01', 'Apex Consultants', 135000, '18%', '=D12*0.09', '=D12*0.09', '=D12+F12+G12'],
            ['INV-012', '2026-03-03', 'Nova Electronics', 42000, '18%', '=D13*0.09', '=D13*0.09', '=D13+F13+G13'],
            ['INV-013', '2026-03-05', 'Fusion Foods Pvt Ltd', 68000, '18%', '=D14*0.09', '=D14*0.09', '=D14+F14+G14'],
            ['INV-014', '2026-03-08', 'Horizon Pharma', 185000, '18%', '=D15*0.09', '=D15*0.09', '=D15+F15+G15'],
            ['INV-015', '2026-03-10', 'Crest Automobiles', 250000, '18%', '=D16*0.09', '=D16*0.09', '=D16+F16+G16'],
            ['INV-016', '2026-03-12', 'Elite Builders', 92000, '18%', '=D17*0.09', '=D17*0.09', '=D17+F17+G17'],
            ['INV-017', '2026-03-15', 'Swift Couriers', 35000, '18%', '=D18*0.09', '=D18*0.09', '=D18+F18+G18'],
            ['INV-018', '2026-03-18', 'Green Energy Ltd', 145000, '18%', '=D19*0.09', '=D19*0.09', '=D19+F19+G19'],
            ['INV-019', '2026-03-20', 'Urban Design Studio', 58000, '18%', '=D20*0.09', '=D20*0.09', '=D20+F20+G20'],
            ['INV-020', '2026-03-22', 'Medicare Supplies', 195000, '18%', '=D21*0.09', '=D21*0.09', '=D21+F21+G21'],
            ['INV-021', '2026-03-25', 'Agri Fresh Pvt Ltd', 72000, '18%', '=D22*0.09', '=D22*0.09', '=D22+F22+G22'],
            ['INV-022', '2026-03-26', 'Digital Wave Inc', 88000, '18%', '=D23*0.09', '=D23*0.09', '=D23+F23+G23'],
            ['INV-023', '2026-03-28', 'Heritage Textiles', 165000, '18%', '=D24*0.09', '=D24*0.09', '=D24+F24+G24'],
            ['INV-024', '2026-03-30', 'Smart Edu Solutions', 48000, '18%', '=D25*0.09', '=D25*0.09', '=D25+F25+G25'],
            ['', '', 'Total', '=SUM(D2:D25)', '', '=SUM(F2:F25)', '=SUM(G2:G25)', '=SUM(H2:H25)'],
          ],
          cellStyles: {
            'A1:H1': { bold: true, bgColor: '#8b5cf6', color: '#ffffff' },
          },
        },
        {
          name: 'Summary',
          rows: [
            ['Month', 'Total Sales', 'Total GST', 'Invoices'],
            ['Feb 2026', '=SUM(Invoices!D2:D25)', '=SUM(Invoices!F2:F25)+SUM(Invoices!G2:G25)', '=COUNTA(Invoices!A2:A25)'],
            ['Mar 2026', '', '', ''],
          ],
        },
      ],
      charts: [
        { type: 'column', title: 'Monthly Sales', dataRange: 'Summary!A1:C3', position: { row: 5, col: 10 } },
      ],
    },
  },
  {
    id: 'project-gantt',
    name: 'Project Gantt Plan',
    category: 'Operations',
    description: 'Visual project timeline with dependencies',
    previewImage: 'https://placehold.co/320x200/0d9488/white?text=Project+Gantt',
    data: {
      sheets: [
        {
          name: 'Tasks',
          rows: [
            ['Task', 'Start', 'Duration (days)', 'End', 'Status', '% Complete'],
            ['Design Phase', '2026-02-01', 10, '=B2+C2', 'In Progress', 60],
            ['Development', '2026-02-11', 15, '=B3+C3', 'Not Started', 0],
            ['Testing', '2026-02-26', 8, '=B4+C4', 'Not Started', 0],
            ['Deployment', '2026-03-06', 3, '=B5+C5', 'Not Started', 0],
            ['Documentation', '2026-02-15', 5, '=B6+C6', 'Not Started', 0],
            ['UAT', '2026-03-01', 5, '=B7+C7', 'Not Started', 0],
            ['Training', '2026-03-10', 2, '=B8+C8', 'Not Started', 0],
            ['Go-Live', '2026-03-12', 1, '=B9+C9', 'Not Started', 0],
            ['Support Handover', '2026-03-13', 3, '=B10+C10', 'Not Started', 0],
            ['Retrospective', '2026-03-16', 1, '=B11+C11', 'Not Started', 0],
            ['', '', '', '', '', ''],
            ['Total days', '', '=SUM(C2:C11)', '', '', '=AVERAGE(F2:F11)'],
          ],
          charts: [{ type: 'bar', title: 'Gantt Chart', dataRange: 'A2:D11', position: { row: 1, col: 8 } }],
        },
      ],
    },
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard',
    category: 'Analytics',
    description: 'Track business KPIs with charts and targets',
    previewImage: 'https://placehold.co/320x200/6366f1/white?text=KPI+Dashboard',
    data: {
      sheets: [
        {
          name: 'KPIs',
          rows: [
            ['Metric', 'Jan', 'Feb', 'Target', '% Achieved'],
            ['Sales (₹ Lakh)', 15.2, 18.7, 20, '=C2/D2'],
            ['New Leads', 45, 62, 50, '=C3/D3'],
            ['Churn Rate %', 3.2, 2.8, 2.5, '=C4/D4'],
            ['Avg Ticket (₹)', 4500, 5200, 5000, '=C5/D5'],
            ['Conversion %', 12, 14.5, 15, '=C6/D6'],
            ['NPS', 42, 48, 50, '=C7/D7'],
            ['Support Tickets', 120, 95, 100, '=C8/D8'],
            ['Revenue (₹ Lakh)', 68, 82, 85, '=C9/D9'],
            ['', '', '', '', ''],
            ['Quarter Total', '=SUM(B2:B9)', '=SUM(C2:C9)', '=SUM(D2:D9)', '=SUM(C2:C9)/SUM(D2:D9)'],
          ],
          charts: [
            { type: 'line', title: 'Sales Trend', dataRange: 'A2:C9', position: { row: 1, col: 6 } },
            { type: 'bar', title: 'Target Achievement', dataRange: 'E2:E9', position: { row: 12, col: 6 } },
          ],
        },
      ],
    },
  },
  {
    id: 'team-payroll',
    name: 'Team Payroll',
    category: 'HR',
    description: 'Monthly salary sheet with CTC breakup and deductions – India payroll',
    previewImage: 'https://placehold.co/320x200/059669/white?text=Team+Payroll',
    data: {
      sheets: [
        {
          name: 'Payroll',
          rows: [
            ['Employee', 'Basic', 'HRA', 'Special Allow', 'Gross', 'PF', 'PT', 'TDS', 'Deductions', 'Net Pay'],
            ['Rahul Sharma', 45000, 22500, 5000, '=SUM(B2:D2)', '=B2*0.12', 200, '=E2*0.05', '=SUM(F2:H2)', '=E2-I2'],
            ['Priya Patel', 52000, 26000, 6000, '=SUM(B3:D3)', '=B3*0.12', 200, '=E3*0.05', '=SUM(F3:H3)', '=E3-I3'],
            ['Amit Kumar', 38000, 19000, 4000, '=SUM(B4:D4)', '=B4*0.12', 200, '=E4*0.05', '=SUM(F4:H4)', '=E4-I4'],
            ['Sneha Reddy', 61000, 30500, 7000, '=SUM(B5:D5)', '=B5*0.12', 200, '=E5*0.05', '=SUM(F5:H5)', '=E5-I5'],
            ['Vikram Singh', 42000, 21000, 4500, '=SUM(B6:D6)', '=B6*0.12', 200, '=E6*0.05', '=SUM(F6:H6)', '=E6-I6'],
            ['Kavita Nair', 48000, 24000, 5500, '=SUM(B7:D7)', '=B7*0.12', 200, '=E7*0.05', '=SUM(F7:H7)', '=E7-I7'],
            ['Rajesh Iyer', 55000, 27500, 6500, '=SUM(B8:D8)', '=B8*0.12', 200, '=E8*0.05', '=SUM(F8:H8)', '=E8-I8'],
            ['Anita Desai', 39000, 19500, 3500, '=SUM(B9:D9)', '=B9*0.12', 200, '=E9*0.05', '=SUM(F9:H9)', '=E9-I9'],
            ['Suresh Menon', 67000, 33500, 8000, '=SUM(B10:D10)', '=B10*0.12', 200, '=E10*0.05', '=SUM(F10:H10)', '=E10-I10'],
            ['Deepa Krishnan', 44000, 22000, 4800, '=SUM(B11:D11)', '=B11*0.12', 200, '=E11*0.05', '=SUM(F11:H11)', '=E11-I11'],
            ['', '', '', '', '=SUM(E2:E11)', '=SUM(F2:F11)', '=SUM(G2:G11)', '=SUM(H2:H11)', '=SUM(I2:I11)', '=SUM(J2:J11)'],
          ],
        },
      ],
    },
  },
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline Tracker',
    category: 'Sales',
    description: 'Deals by stage with value, probability and expected revenue',
    previewImage: 'https://placehold.co/320x200/7c3aed/white?text=Sales+Pipeline',
    data: {
      sheets: [
        {
          name: 'Pipeline',
          rows: [
            ['Deal', 'Contact', 'Stage', 'Value (₹)', 'Probability %', 'Expected', 'Close Date', 'Owner'],
            ['D-001', 'ABC Corp – Enterprise', 'Negotiation', 850000, '80%', '=D2*0.8', '2026-03-15', 'Rahul'],
            ['D-002', 'XYZ Industries', 'Proposal', 420000, '60%', '=D3*0.6', '2026-03-22', 'Priya'],
            ['D-003', 'Tech Solutions India', 'Qualified', 620000, '30%', '=D4*0.3', '2026-04-10', 'Rahul'],
            ['D-004', 'Global Exports Ltd', 'Lead', 1200000, '10%', '=D5*0.1', '2026-04-30', 'Amit'],
            ['D-005', 'Metro Traders', 'Won', 185000, '100%', '=D6', '2026-02-28', 'Priya'],
            ['D-006', 'Prime Services', 'Proposal', 340000, '60%', '=D7*0.6', '2026-03-25', 'Amit'],
            ['D-007', 'Sunrise Enterprises', 'Negotiation', 275000, '80%', '=D8*0.8', '2026-03-18', 'Rahul'],
            ['D-008', 'Delta Manufacturing', 'Qualified', 520000, '30%', '=D9*0.3', '2026-04-05', 'Priya'],
            ['D-009', 'Pioneer Logistics', 'Lead', 380000, '10%', '=D10*0.1', '2026-05-15', 'Amit'],
            ['D-010', 'Summit Retail', 'Proposal', 195000, '60%', '=D11*0.6', '2026-03-20', 'Rahul'],
            ['D-011', 'Apex Consultants', 'Negotiation', 720000, '80%', '=D12*0.8', '2026-03-28', 'Priya'],
            ['D-012', 'Nova Electronics', 'Qualified', 280000, '30%', '=D13*0.3', '2026-04-12', 'Amit'],
            ['D-013', 'Fusion Foods Pvt Ltd', 'Lead', 450000, '10%', '=D14*0.1', '2026-05-01', 'Rahul'],
            ['D-014', 'Horizon Pharma', 'Proposal', 890000, '60%', '=D15*0.6', '2026-04-08', 'Priya'],
            ['D-015', 'Crest Automobiles', 'Negotiation', 1100000, '80%', '=D16*0.8', '2026-03-30', 'Amit'],
            ['D-016', 'Elite Builders', 'Qualified', 310000, '30%', '=D17*0.3', '2026-04-18', 'Rahul'],
            ['D-017', 'Swift Couriers', 'Lead', 165000, '10%', '=D18*0.1', '2026-05-20', 'Priya'],
            ['D-018', 'Green Energy Ltd', 'Proposal', 540000, '60%', '=D19*0.6', '2026-04-22', 'Amit'],
            ['D-019', 'Urban Design Studio', 'Negotiation', 220000, '80%', '=D20*0.8', '2026-03-25', 'Rahul'],
            ['D-020', 'Medicare Supplies', 'Won', 425000, '100%', '=D21', '2026-02-15', 'Priya'],
            ['', '', 'Pipeline Total', '=SUM(D2:D21)', '', '=SUM(F2:F21)', '', ''],
          ],
        },
      ],
    },
  },
  {
    id: 'annual-budget',
    name: 'Annual Budget (Chart-ready)',
    category: 'Finance',
    description: 'Monthly income, expenses and savings—ideal for bar or line charts',
    previewImage: 'https://placehold.co/320x200/0d9488/white?text=Annual+Budget',
    data: {
      sheets: [
        {
          name: 'Budget',
          rows: [
            ['Month', 'Income (₹)', 'Expenses (₹)', 'Savings (₹)'],
            ['Jan', 285000, 192000, '=B2-C2'],
            ['Feb', 312000, 205000, '=B3-C3'],
            ['Mar', 298000, 198000, '=B4-C4'],
            ['Apr', 320000, 215000, '=B5-C5'],
            ['May', 335000, 228000, '=B6-C6'],
            ['Jun', 308000, 210000, '=B7-C7'],
            ['Jul', 325000, 218000, '=B8-C8'],
            ['Aug', 340000, 232000, '=B9-C9'],
            ['Sep', 318000, 205000, '=B10-C10'],
            ['Oct', 332000, 222000, '=B11-C11'],
            ['Nov', 345000, 235000, '=B12-C12'],
            ['Dec', 358000, 248000, '=B13-C13'],
            ['Total', '=SUM(B2:B13)', '=SUM(C2:C13)', '=SUM(D2:D13)'],
          ],
        },
      ],
    },
  },
]

export { TEMPLATES }
