const fs = require('fs');
const path = require('path');

// Configuration
const FIXES = [
  {
    name: 'Replace requireHRAccess with requireModuleAccess',
    pattern: /requireHRAccess\(request\)/g,
    replacement: "requireModuleAccess(request, 'hr')",
    description: 'Fixing requireHRAccess calls'
  },
  {
    name: 'Replace requireModuleAccess(request) with requireModuleAccess(request, module)',
    pattern: /requireModuleAccess\(request\)(?!\s*,\s*['"])/g,
    replacement: (match, filePath) => {
      // Determine module based on file path
      if (filePath.includes('hr-module')) return "requireModuleAccess(request, 'hr')";
      if (filePath.includes('crm-module')) return "requireModuleAccess(request, 'crm')";
      if (filePath.includes('finance-module')) return "requireModuleAccess(request, 'finance')";
      if (filePath.includes('marketing')) return "requireModuleAccess(request, 'marketing')";
      return match; // Keep original if we can't determine
    },
    description: 'Adding module parameter to requireModuleAccess'
  },
  {
    name: 'Replace @payaid/db with @/lib/db/prisma',
    pattern: /from ['"]@payaid\/db['"]/g,
    replacement: "from '@/lib/db/prisma'",
    description: 'Fixing Prisma import paths'
  },
  {
    name: 'Replace @payaid/oauth-client imports',
    pattern: /from ['"]@payaid\/oauth-client['"]/g,
    replacement: "from '@/lib/middleware/auth'",
    description: 'Fixing OAuth client imports'
  }
];

// Directories to process
const DIRECTORIES = [
  'hr-module/app/api',
  'hr-module/lib',
  'hr-module/middleware.ts',
  'crm-module/app/api',
  'crm-module/lib',
  'crm-module/middleware.ts',
  'finance-module/app/api',
  'invoicing-module/app/api',
  'app/api'
];

// Files to skip
const SKIP_FILES = [
  'node_modules',
  '.next',
  '.git'
];

function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return { fixed: false, reason: 'Skipped' };
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fixesApplied = [];

    for (const fix of FIXES) {
      let newContent;
      if (typeof fix.replacement === 'function') {
        // Custom replacement function
        newContent = content.replace(fix.pattern, (match) => fix.replacement(match, filePath));
      } else {
        // Simple string replacement
        newContent = content.replace(fix.pattern, fix.replacement);
      }

      if (newContent !== content) {
        content = newContent;
        modified = true;
        fixesApplied.push(fix.name);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { fixed: true, fixesApplied };
    }

    return { fixed: false, reason: 'No changes needed' };
  } catch (error) {
    return { fixed: false, reason: `Error: ${error.message}` };
  }
}

function findTypeScriptFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const stat = fs.statSync(dir);
  
  // If it's a file, add it directly
  if (stat.isFile() && (dir.endsWith('.ts') || dir.endsWith('.tsx'))) {
    fileList.push(dir);
    return fileList;
  }

  // If it's a directory, process it
  if (stat.isDirectory()) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isDirectory()) {
        findTypeScriptFiles(filePath, fileList);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    });
  }

  return fileList;
}

function main() {
  console.log('🔧 Starting batch fix for build errors...\n');

  let totalFiles = 0;
  let fixedFiles = 0;
  const results = [];

  // Process each directory
  DIRECTORIES.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      return;
    }

    console.log(`📁 Processing directory: ${dir}`);
    const files = findTypeScriptFiles(dir);
    totalFiles += files.length;

    files.forEach(file => {
      const result = processFile(file);
      if (result.fixed) {
        fixedFiles++;
        results.push({ file, fixes: result.fixesApplied });
        console.log(`  ✅ Fixed: ${file}`);
        result.fixesApplied.forEach(fix => {
          console.log(`     - ${fix}`);
        });
      }
    });
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - fixedFiles}`);
  console.log('='.repeat(60));

  if (results.length > 0) {
    console.log('\n📝 Files modified:');
    results.forEach(({ file, fixes }) => {
      console.log(`   ${file}`);
      fixes.forEach(fix => console.log(`      - ${fix}`));
    });
  }

  console.log('\n✨ Batch fix complete!');
}

// Run the script
main();

