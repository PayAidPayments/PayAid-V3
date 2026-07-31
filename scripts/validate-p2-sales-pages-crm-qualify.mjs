/**
 * P2 Sales Pages → CRM qualify loop — static smoke (no DB).
 * Confirms Sales host submit path matches dashboard landing-page-bridge-v2.
 * Run: node scripts/validate-p2-sales-pages-crm-qualify.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const salesRoute = read('apps/sales/app/api/sales-submissions/route.ts')
const dashboardRoute = read('apps/dashboard/app/api/sales-submissions/route.ts')
const bridge = read('lib/sales-pages/landing-page-submission-bridge.ts')
const submissionsPage = read('apps/sales/app/sales/[tenantId]/Submissions/page.tsx')

const out = {
  salesImportsBridge: salesRoute.includes('processSalesPageSubmission'),
  salesHasGet: /export async function GET/.test(salesRoute),
  salesHasRetry: salesRoute.includes("action: z.literal('retry')") || salesRoute.includes("action === 'retry'"),
  salesBridgeV2: salesRoute.includes("'landing-page-bridge-v2'"),
  salesNoQueuedStub: !salesRoute.includes("crmSync: 'queued'"),
  dashboardImportsBridge: dashboardRoute.includes('processSalesPageSubmission'),
  dashboardBridgeV2: dashboardRoute.includes("'landing-page-bridge-v2'"),
  bridgeWritesLog: bridge.includes('submissionLog') && bridge.includes('prisma.contact'),
  bridgeList: bridge.includes('listSalesPageSubmissions'),
  bridgeRetry: bridge.includes('retrySalesPageSubmission'),
  bridgeNoInboundImport: !bridge.includes("from '@/lib/crm/inbound-orchestration'"),
  submissionsUi: submissionsPage.includes('Retry CRM sync') && submissionsPage.includes('crmSyncStatus'),
  kickoffDoc: fs.existsSync(
    path.join(root, 'docs/evidence/closure/2026-07-29-p2-kickoff-sales-pages-crm.md')
  ),
}

out.pass = Object.values(out).every((v) => v === true)
console.log(JSON.stringify(out, null, 2))
if (!out.pass) process.exit(1)
