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
  
  // Replace requireCommunicationAccess(request) with requireModuleAccess(request, 'communication')
  if (content.includes('requireCommunicationAccess')) {
    // Pattern 1: const { tenantId } = await requireCommunicationAccess(request)
    content = content.replace(
      /const\s*\{\s*tenantId\s*\}\s*=\s*await\s+requireCommunicationAccess\(request\)/g,
      "const { tenantId } = await requireModuleAccess(request, 'communication')"
    )
    
    // Pattern 2: await requireCommunicationAccess(request)
    content = content.replace(
      /await\s+requireCommunicationAccess\(request\)/g,
      "await requireModuleAccess(request, 'communication')"
    )
    
    // Pattern 3: requireCommunicationAccess(request) without await
    content = content.replace(
      /requireCommunicationAccess\(request\)/g,
      "requireModuleAccess(request, 'communication')"
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

// Find all TypeScript files
const files = findFiles('app/api/email')
let fixedCount = 0

files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++
  }
})

console.log(`\nFixed ${fixedCount} files`)

