#!/usr/bin/env node

/**
 * Route Verification Script
 * Verifies that all route files exist and are properly configured
 */

const fs = require('fs');
const path = require('path');

const routesToVerify = [
  'app/home/[tenantId]/page.tsx',
  'app/super-admin/revenue/payments/page.tsx',
  'app/super-admin/revenue/billing/page.tsx',
  'app/super-admin/revenue/plans/page.tsx',
  'app/super-admin/revenue/analytics/page.tsx',
  'app/super-admin/revenue/reports/page.tsx',
];

console.log('🔍 Verifying route files...\n');

let allRoutesExist = true;

routesToVerify.forEach((route) => {
  const fullPath = path.join(process.cwd(), route);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${route}`);
  } else {
    console.log(`❌ ${route} - MISSING`);
    allRoutesExist = false;
  }
});

console.log('\n');

if (allRoutesExist) {
  console.log('✅ All routes verified successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your Next.js dev server: npm run dev');
  console.log('2. If issues persist, clear cache: Remove-Item -Recurse -Force .next');
  process.exit(0);
} else {
  console.log('❌ Some routes are missing. Please check the errors above.');
  process.exit(1);
}
