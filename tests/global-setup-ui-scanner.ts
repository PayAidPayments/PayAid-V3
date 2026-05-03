/**
 * Ensures tests/ui-scanner.spec.ts is always a stub that throws immediately.
 * This prevents the historical "old spec" (PAGE_TIMEOUT_MS, tenant link GET checks) from ever running,
 * even if a local checkout/IDE resurrects it.
 */
import * as fs from 'fs';
import * as path from 'path';

const STUB = `/**
 * DO NOT RUN THIS FILE.
 *
 * The scanner entry is: tests/ui-scanner-run.spec.ts → tests/ui-scanner-impl.ts
 * Run via: npm run test:e2e:ui-scanner
 */
throw new Error(
  'Do not run tests/ui-scanner.spec.ts. Run: npm run test:e2e:ui-scanner (uses tests/ui-scanner-run.spec.ts → ui-scanner-impl.ts)'
);
`;

export default function globalSetup() {
  const specPath = path.join(process.cwd(), 'tests', 'ui-scanner.spec.ts');
  fs.writeFileSync(specPath, STUB, 'utf8');
}
