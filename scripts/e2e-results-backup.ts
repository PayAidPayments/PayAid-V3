/**
 * Copies e2e-results.json to a timestamped backup after a share run.
 * Lets you regenerate E2E_RESULTS.md from a past run: npx tsx scripts/e2e-results-to-markdown.ts e2e-results-backups/e2e-results-<timestamp>.json
 */
import * as fs from 'fs';
import * as path from 'path';

const resultsPath = path.join(process.cwd(), 'e2e-results.json');
const backupDir = path.join(process.cwd(), 'e2e-results-backups');

if (!fs.existsSync(resultsPath)) {
  process.exit(0); // no JSON, nothing to backup
}

const raw = fs.readFileSync(resultsPath, 'utf-8');
let report: { stats?: { startTime?: string } };
try {
  report = JSON.parse(raw);
} catch {
  process.exit(0);
}

const startTime = report.stats?.startTime || new Date().toISOString();
const safe = startTime.replace(/[:.]/g, '-').slice(0, 23);
const backupPath = path.join(backupDir, `e2e-results-${safe}.json`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
fs.copyFileSync(resultsPath, backupPath);
console.log('Backed up to', path.relative(process.cwd(), backupPath));
