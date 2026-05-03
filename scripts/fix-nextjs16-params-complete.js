#!/usr/bin/env node

/**
 * Complete script to fix Next.js 16 async params in route handlers
 * Handles:
 * - Old format: { params: { id: string } }
 * - Union types: { params: Promise<{ id: string }> | { id: string } }
 * - Any other variations
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

    // Check if file has any params that need fixing
    // Look for union types or old format
    const hasUnionType = /\{ params \}: \{ params: Promise<[^>]+> \| \{/.test(content);
    const hasOldFormat = /\{ params \}: \{ params: \{ [^P]/.test(content);
    
    if (!hasUnionType && !hasOldFormat) {
      return; // Skip files that are already correct
    }

    // Fix union types: Promise<{...}> | {...} -> Promise<{...}>
    if (hasUnionType) {
      content = content.replace(
        /\{ params \}: \{ params: Promise<\{ ([^}]+) \}> \| \{ [^}]+\} \}/g,
        (match, paramsDef) => {
          modified = true;
          return `{ params }: { params: Promise<{ ${paramsDef} }> }`;
        }
      );
    }

    // Fix old format: { params: {...} } -> Promise<{...}>
    if (hasOldFormat) {
      content = content.replace(
        /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
        (match, paramsDef) => {
          // Skip if already Promise
          if (match.includes('Promise')) return match;
          modified = true;
          return `{ params }: { params: Promise<{ ${paramsDef} }> }`;
        }
      );
    }

    // Extract all param names from the type definition
    const paramMatches = [...content.matchAll(/\{ params \}: \{ params: Promise<\{ ([^}]+) \}> \}/g)];
    
    if (paramMatches.length === 0) {
      // Try to extract from any params definition
      const anyParamMatch = content.match(/\{ params \}: \{ params: [^}]+ \}/);
      if (anyParamMatch) {
        const paramString = anyParamMatch[0];
        const extracted = paramString.match(/\{ ([^:}]+):/);
        if (extracted) {
          paramMatches.push({ 1: extracted[1] });
        }
      }
    }

    // Get unique param names
    const allParams = new Set();
    paramMatches.forEach(match => {
      const paramString = match[1];
      paramString.split(',').forEach(p => {
        const paramName = p.trim().split(':')[0].trim();
        if (paramName) allParams.add(paramName);
      });
    });

    // Add resolvedParams after function opening brace (if not already present)
    // Match function signatures with params
    content = content.replace(
      /(export async function (GET|POST|PATCH|DELETE|PUT)\([^)]*\{ params \}: \{ params: Promise<\{ [^}]+\}> \}[^)]*\) \{)/g,
      (match) => {
        if (match.includes('resolvedParams') || match.includes('await params')) {
          return match;
        }
        modified = true;
        return match.replace(/\) \{/, `) {\n    // Handle Next.js 16+ async params\n    const resolvedParams = await params`);
      }
    );

    // Also handle union types that were just fixed
    content = content.replace(
      /(export async function (GET|POST|PATCH|DELETE|PUT)\([^)]*\{ params \}: \{ params: Promise<\{ [^}]+\}> \}[^)]*\) \{)/g,
      (match) => {
        if (match.includes('resolvedParams') || match.includes('await params')) {
          return match;
        }
        modified = true;
        return match.replace(/\) \{/, `) {\n    // Handle Next.js 16+ async params\n    const resolvedParams = await params`);
      }
    );

    // Replace all params.X with resolvedParams.X (but not in type definitions)
    allParams.forEach(paramName => {
      // Use word boundaries to avoid matching in type definitions
      const regex = new RegExp(`\\bparams\\.${paramName}\\b`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `resolvedParams.${paramName}`);
        modified = true;
      }
    });

    // Also fix any remaining Promise.resolve(params) patterns
    if (content.includes('Promise.resolve(params)')) {
      content = content.replace(/const resolvedParams = await Promise\.resolve\(params\)/g, 'const resolvedParams = await params');
      modified = true;
    }

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

