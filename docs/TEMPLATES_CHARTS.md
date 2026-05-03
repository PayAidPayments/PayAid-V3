# Chart-ready templates and adding more

Inspired by [Excel's template gallery](https://excel.cloud.microsoft/create/en/templates/) (planning & tracking, business spreadsheets, [Gantt charts](https://excel.cloud.microsoft/create/en/gantt-charts/)).

## Chart-ready templates

Templates with **clear numeric columns** (e.g. Month + values) work best with the editor’s **Chart** button and **AI → Create chart**:

- **KPI Dashboard** – Metric, Jan, Feb, Target, % Achieved → line or bar
- **Annual Budget (Chart-ready)** – Month, Income, Expenses, Savings → bar or line
- **GST Invoice Log** – use Summary sheet or Invoices totals for charts
- **Sales Pipeline** – Value by stage or owner → bar/pie
- **Project Gantt** – Task, Start, Duration, End → bar (timeline)

In the editor: select the range (e.g. headers + data rows), click **Chart** or **AI → Create chart**, choose bar/line/pie.

## Adding templates with pre-existing data, charts, graphs

1. **Pre-filled data**  
   Add rows in `lib/templates.ts` (production) or `lib/spreadsheet/templates.ts` (legacy). Use formulas (`=SUM(...)`, `=B2-C2`) and numeric values so totals and charts work.

2. **Chart-ready layout**  
   - Put **labels in the first column** (e.g. Month, Task, Category).  
   - Put **numeric series in following columns** (e.g. Sales, Target, Expenses).  
   - The editor’s Chart flow uses the first column for labels and the next for values (or two value series for comparison).

3. **Embedded charts**  
   The x-data-spreadsheet engine does not persist embedded chart objects. Charts are created in the editor via **Chart** or **AI → Create chart** from the current selection. Template definitions can still describe `charts: [{ type, title, dataRange }]` for documentation; the actual chart is added by the user after opening the template.

4. **More ideas (Excel-style)**  
   - Balance sheet (assets, liabilities, equity)  
   - Weekly timesheet (hours by day, totals)  
   - Simple Gantt (task, start date, duration, end date, % complete)  
   - Invoice generator (line items, GST, total)  
   - Inventory tracker (SKU, stock, min/max, reorder)  

To add a new **production** template (multi-sheet, chart-friendly): add an entry to the `TEMPLATES` array in `lib/templates.ts` with `data.sheets[].rows` and optional `previewImage`. To add a **legacy** template: add to `SHEET_TEMPLATES` in `lib/spreadsheet/templates.ts` with `data: string[][]`.

If you want more templates with specific pre-existing data (e.g. 12-month sales vs target, or a Gantt with sample tasks), share the columns and sample rows and we can add them.
