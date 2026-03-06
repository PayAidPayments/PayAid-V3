# Overwrites tests/ui-scanner.spec.ts with a stub that throws on load.
# Run this if you see "Broken links ... -1" or "ui-scanner.spec.ts:10" / ":61" with PAGE_TIMEOUT_MS.
$ErrorActionPreference = 'Stop'
$specPath = Join-Path $PSScriptRoot '..' 'tests' 'ui-scanner.spec.ts'
$stub = @'
/**
 * DO NOT RUN THIS FILE.
 * Scanner entry: tests/ui-scanner-run.spec.ts → tests/ui-scanner-impl.ts
 * Run via: npm run test:e2e:ui-scanner
 */
throw new Error(
  'Do not run tests/ui-scanner.spec.ts. Run: npm run test:e2e:ui-scanner (uses ui-scanner-run.spec.ts → ui-scanner-impl.ts)'
);
'@
Set-Content -Path $specPath -Value $stub.TrimEnd() -Encoding UTF8 -NoNewline
Write-Host "Overwrote $specPath with stub. Run scanner with: npm run test:e2e:ui-scanner"
