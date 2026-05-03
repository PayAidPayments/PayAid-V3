const fs = require('fs')
const path = require('path')

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false
  
  // Replace requireHRAccess(request) with requireModuleAccess(request, 'hr')
  if (content.includes('requireHRAccess')) {
    // Pattern 1: const { tenantId } = await requireHRAccess(request)
    content = content.replace(
      /const\s*\{\s*tenantId\s*\}\s*=\s*await\s+requireHRAccess\(request\)/g,
      "const { tenantId } = await requireModuleAccess(request, 'hr')"
    )
    
    // Pattern 2: await requireHRAccess(request)
    content = content.replace(
      /await\s+requireHRAccess\(request\)/g,
      "await requireModuleAccess(request, 'hr')"
    )
    
    // Pattern 3: requireHRAccess(request) without await
    content = content.replace(
      /requireHRAccess\(request\)/g,
      "requireModuleAccess(request, 'hr')"
    )
    
    modified = true
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`Fixed: ${filePath}`)
    return true
  }
  
  return false
}

// Find all TypeScript files in app/api/hr
const files = findFiles('app/api/hr')
let fixedCount = 0

files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++
  }
})

console.log(`\nFixed ${fixedCount} files`)

