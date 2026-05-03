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
  
  // Check if file has async params and uses resolvedParams
  if (!/params:\s*Promise<\{[^}]+\}>/.test(content)) return false
  if (!/resolvedParams\./.test(content)) return false
  
  // Split by function declarations
  const functionRegex = /export async function (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\([^)]*\{ params \}: \{ params: Promise<\{[^}]+\}> \}\)\s*\{/g
  let match
  const fixes = []
  
  while ((match = functionRegex.exec(content)) !== null) {
    const funcStart = match.index + match[0].length
    const funcEnd = findMatchingBrace(content, funcStart)
    const funcBody = content.substring(funcStart, funcEnd)
    
    // Check if this function uses resolvedParams but doesn't define it
    if (funcBody.includes('resolvedParams.') && !funcBody.includes('const resolvedParams = await params')) {
      // Find the try block
      const tryMatch = funcBody.match(/try\s*\{/)
      if (tryMatch) {
        const tryIndex = funcBody.indexOf(tryMatch[0]) + tryMatch[0].length
        const beforeTry = funcBody.substring(0, tryIndex)
        const indent = beforeTry.match(/\n(\s*)$/)?.[1] || '    '
        fixes.push({
          position: funcStart + tryIndex,
          text: `\n${indent}const resolvedParams = await params`
        })
        modified = true
      }
    }
  }
  
  // Apply fixes in reverse order to maintain positions
  if (modified && fixes.length > 0) {
    fixes.sort((a, b) => b.position - a.position)
    fixes.forEach(fix => {
      content = content.substring(0, fix.position) + fix.text + content.substring(fix.position)
    })
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`Fixed: ${filePath}`)
    return true
  }
  
  return false
}

function findMatchingBrace(str, start) {
  let depth = 1
  let i = start
  while (i < str.length && depth > 0) {
    if (str[i] === '{') depth++
    if (str[i] === '}') depth--
    i++
  }
  return i
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

