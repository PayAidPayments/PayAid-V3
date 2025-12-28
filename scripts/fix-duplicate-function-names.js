const fs = require('fs')
const path = require('path')

function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList
  
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    try {
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findFiles(filePath, fileList)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath)
      }
    } catch (e) {
      // Skip files we can't access
    }
  })
  
  return fileList
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false
  
  // Fix duplicate function names: GETGET -> GET, PATCHPATCH -> PATCH, etc.
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  
  methods.forEach(method => {
    const duplicate = `${method}${method}`
    if (content.includes(`function ${duplicate}(`)) {
      content = content.replace(new RegExp(`function ${duplicate}\\(`, 'g'), `function ${method}(`)
      modified = true
    }
  })
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`Fixed: ${filePath}`)
    return true
  }
  
  return false
}

// Find all TypeScript files in app/api
const files = findFiles('app/api')
let fixedCount = 0

files.forEach(file => {
  try {
    if (fixFile(file)) {
      fixedCount++
    }
  } catch (e) {
    console.error(`Error fixing ${file}:`, e.message)
  }
})

console.log(`\nFixed ${fixedCount} files`)

