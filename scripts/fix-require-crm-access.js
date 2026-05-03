const fs = require('fs');
const path = require('path');

// Find all TypeScript files in app/api
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Replace requireCRMAccess with requireModuleAccess
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file uses requireCRMAccess
  if (content.includes('requireCRMAccess')) {
    // Replace requireCRMAccess(request) with requireModuleAccess(request, 'crm')
    content = content.replace(
      /requireCRMAccess\(request\)/g,
      "requireModuleAccess(request, 'crm')"
    );
    
    // Check if requireModuleAccess is imported, if not, add it
    if (!content.includes("requireModuleAccess")) {
      // Try to find existing import from @/lib/middleware/auth
      const authImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/middleware\/auth['"]/;
      const match = content.match(authImportRegex);
      
      if (match) {
        // Add requireModuleAccess to existing import
        const imports = match[1].split(',').map(i => i.trim());
        if (!imports.includes('requireModuleAccess')) {
          imports.push('requireModuleAccess');
          content = content.replace(
            authImportRegex,
            `import { ${imports.join(', ')} } from '@/lib/middleware/auth'`
          );
        }
      } else {
        // Add new import at the top
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            insertIndex = i + 1;
          }
        }
        lines.splice(insertIndex, 0, "import { requireModuleAccess } from '@/lib/middleware/auth'");
        content = lines.join('\n');
      }
    }
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
const appApiDir = path.join(__dirname, '..', 'app', 'api');
const crmModuleDir = path.join(__dirname, '..', 'crm-module', 'app', 'api');

const files = [];
if (fs.existsSync(appApiDir)) {
  findFiles(appApiDir, files);
}
if (fs.existsSync(crmModuleDir)) {
  findFiles(crmModuleDir, files);
}

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files.`);

