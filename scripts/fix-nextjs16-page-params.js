#!/usr/bin/env node

/**
 * Script to fix Next.js 16 async params in page components
 * Handles page.tsx files with params
 */

const fs = require('fs');
const path = require('path');

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all page.tsx files in app
const pageFiles = findPageFiles('app');
let fixedCount = 0;

pageFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if file has params that need fixing (not Promise)
    const hasOldFormat = /params:\s*\{[^}]*\}/.test(content) && !/params:\s*Promise<\{/.test(content);
    
    if (!hasOldFormat) {
      return; // Skip files that already use Promise or don't have params
    }

    // Extract param names from the type definition
    const paramMatch = content.match(/params:\s*\{([^}]+)\}/);
    if (!paramMatch) return;

    const paramString = paramMatch[1];
    const params = paramString.split(',').map(p => {
      const trimmed = p.trim();
      const nameMatch = trimmed.match(/^([^:]+):/);
      return nameMatch ? nameMatch[1].trim() : trimmed.split(':')[0].trim();
    }).filter(Boolean);

    // Replace the type definition: params: {...} -> params: Promise<{...}>
    content = content.replace(
      /params:\s*\{([^}]+)\}/g,
      (match, paramsDef) => {
        // Skip if already Promise
        if (match.includes('Promise')) return match;
        modified = true;
        return `params: Promise<{${paramsDef}}>`;
      }
    );

    // Add resolvedParams after function opening brace (if not already present)
    // Match function signatures with params
    const functionPattern = /(export\s+(default\s+)?(async\s+)?function\s+\w+\([^)]*params[^)]*\)\s*\{)/g;
    
    content = content.replace(functionPattern, (match) => {
      if (match.includes('resolvedParams') || match.includes('await params')) {
        return match;
      }
      modified = true;
      return match.replace(/\{/, `{\n  // Handle Next.js 16+ async params\n  const resolvedParams = await params`);
    });

    // Also handle arrow functions
    const arrowPattern = /(const\s+\w+\s*=\s*async\s*\([^)]*params[^)]*\)\s*=>\s*\{)/g;
    content = content.replace(arrowPattern, (match) => {
      if (match.includes('resolvedParams') || match.includes('await params')) {
        return match;
      }
      modified = true;
      return match.replace(/\{/, `{\n  // Handle Next.js 16+ async params\n  const resolvedParams = await params`);
    });

    // Replace all params.X with resolvedParams.X (but not in type definitions)
    params.forEach(paramName => {
      // Use word boundaries to avoid matching in type definitions
      const regex = new RegExp(`\\bparams\\.${paramName}\\b`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `resolvedParams.${paramName}`);
        modified = true;
      }
    });

    // Also fix array access like params.path
    params.forEach(paramName => {
      const arrayRegex = new RegExp(`\\bparams\\[['"]${paramName}['"]\\]`, 'g');
      if (arrayRegex.test(content)) {
        content = content.replace(arrayRegex, `resolvedParams['${paramName}']`);
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

console.log(`\n✅ Fixed ${fixedCount} page component files`);

