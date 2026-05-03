#!/usr/bin/env node

/**
 * Script to fix Next.js 16 async params in route handlers
 * This converts { params: { id: string } } to { params: Promise<{ id: string }> }
 * and adds the await params resolution
 */

const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all route.ts files in app/api
const routeFiles = findRouteFiles('app/api');
let fixedCount = 0;

routeFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if file has old params format (not Promise)
    const hasOldFormat = /\{ params \}: \{ params: \{ [^P]/.test(content);
    
    if (!hasOldFormat) {
      return; // Skip files that already use Promise or don't have params
    }

    // Find all function exports and fix them
    const functionPatterns = [
      /export async function (GET|POST|PATCH|DELETE|PUT)\([\s\S]*?\{ params \}: \{ params: \{ ([^}]+) \} \}[\s\S]*?\) \{/g
    ];

    // Extract param names from all function signatures
    const paramMatches = [...content.matchAll(/\{ params \}: \{ params: \{ ([^}]+) \} \}/g)];
    
    if (paramMatches.length === 0) return;

    // Get unique param names
    const allParams = new Set();
    paramMatches.forEach(match => {
      const paramString = match[1];
      paramString.split(',').forEach(p => {
        const paramName = p.trim().split(':')[0].trim();
        if (paramName) allParams.add(paramName);
      });
    });

    // Replace the type definition
    content = content.replace(
      /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
      (match, paramsDef) => {
        modified = true;
        return `{ params }: { params: Promise<{ ${paramsDef} }> }`;
      }
    );

    // Add resolvedParams after function opening brace (if not already present)
    content = content.replace(
      /(export async function (GET|POST|PATCH|DELETE|PUT)\([^)]*\{ params \}: \{ params: Promise<\{ [^}]+\} \}[^)]*\) \{)/g,
      (match) => {
        if (match.includes('resolvedParams')) {
          return match;
        }
        modified = true;
        return match.replace(/\) \{/, `) {\n    // Handle Next.js 16+ async params\n    const resolvedParams = await params`);
      }
    );

    // Replace all params.X with resolvedParams.X
    allParams.forEach(paramName => {
      const regex = new RegExp(`\\bparams\\.${paramName}\\b`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `resolvedParams.${paramName}`);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} route handler files`);
