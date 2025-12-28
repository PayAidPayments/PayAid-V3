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
  
  // Check if file has async params and uses resolvedParams but doesn't define it
  const hasAsyncParams = /params:\s*Promise<\{[^}]+\}>/.test(content)
  const usesResolvedParams = /resolvedParams\./.test(content)
  
  if (hasAsyncParams && usesResolvedParams) {
    // Split into functions
    const functions = content.split(/(export async function (GET|POST|PUT|PATCH|DELETE))/)
    
    for (let i = 0; i < functions.length; i += 2) {
      if (i + 1 < functions.length) {
        const funcHeader = functions[i + 1]
        const funcBody = functions[i + 2] || ''
        
        // Check if this function uses resolvedParams
        if (funcBody.includes('resolvedParams.') && !funcBody.includes('const resolvedParams = await params')) {
          // Find the opening brace and add resolvedParams
          const tryMatch = funcBody.match(/try\s*\{/)
          if (tryMatch) {
            const tryIndex = funcBody.indexOf(tryMatch[0]) + tryMatch[0].length
            const indent = funcBody.substring(0, tryIndex).match(/\n(\s*)$/)?.[1] || '    '
            const insertText = `\n${indent}const resolvedParams = await params`
            functions[i + 2] = funcBody.substring(0, tryIndex) + insertText + funcBody.substring(tryIndex)
            modified = true
          }
        }
      }
    }
    
    if (modified) {
      content = functions.join('')
    }
  }
  
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

