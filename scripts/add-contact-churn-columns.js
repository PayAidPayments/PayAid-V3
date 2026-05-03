#!/usr/bin/env node
/**
 * One-time script: add Phase 1B Contact churn columns to the database.
 * Use this when production still runs an old build that expects Contact.churnRiskScore
 * and you get: "The column Contact.churnRiskScore does not exist in the current database."
 *
 * Run: node scripts/add-contact-churn-columns.js
 * Or:  DATABASE_URL="postgresql://..." node scripts/add-contact-churn-columns.js
 *
 * Requires DATABASE_URL in env or .env.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function main() {
  const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'add_phase1b_contact_churn_columns.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set. Set it in .env or pass it when running this script.');
    process.exit(1);
  }
  try {
    execSync(`npx prisma db execute --stdin`, {
      input: sql,
      stdio: ['pipe', 'inherit', 'inherit'],
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('Contact churn columns added (or already present).');
  } catch (e) {
    console.error('Failed to run SQL:', e.message);
    process.exit(1);
  }
}

main();
