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
  
  // Fix 1: Replace @payaid/db imports
  if (content.includes("from '@payaid/db'") || content.includes('from "@payaid/db"')) {
    content = content.replace(/from ['"]@payaid\/db['"]/g, "from '@/lib/db/prisma'")
    modified = true
  }
  
  // Fix 2: Add resolvedParams for async params in route handlers
  // Pattern: export async function METHOD(request, { params }: { params: Promise<{...}> })
  const routeHandlerPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\{ params \}: \{ params: Promise<\{[^}]+\}> \}\)\s*\{/g
  const matches = [...content.matchAll(routeHandlerPattern)]
  
  matches.forEach(match => {
    const funcStart = match.index + match[0].length
    const nextBrace = content.indexOf('{', funcStart)
    const funcBody = content.substring(funcStart, nextBrace + 1)
    
    // Check if resolvedParams is already defined
    if (!funcBody.includes('resolvedParams') && funcBody.includes('params.')) {
      // Find the first line after the opening brace
      const afterBrace = content.indexOf('{', funcStart) + 1
      const firstLineEnd = content.indexOf('\n', afterBrace)
      const indent = content.substring(afterBrace, firstLineEnd).match(/^\s*/)?.[0] || '    '
      
      // Extract param names from Promise<{ id: string, ... }>
      const paramsMatch = match[0].match(/Promise<\{([^}]+)\}>/)
      if (paramsMatch) {
        const paramNames = paramsMatch[1].split(',').map(p => p.trim().split(':')[0].trim())
        const firstParam = paramNames[0]
        
        // Add resolvedParams = await params
        const insertPoint = afterBrace
        const insertText = `\n${indent}const resolvedParams = await params`
        content = content.substring(0, insertPoint) + insertText + content.substring(insertPoint)
        modified = true
      }
    }
  })
  
  // Fix 3: Replace params.X with resolvedParams.X (simple cases)
  if (content.includes('resolvedParams') && content.includes('params.')) {
    // Only replace if resolvedParams is defined in the same function
    const lines = content.split('\n')
    let inFunction = false
    let hasResolvedParams = false
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/export async function (GET|POST|PUT|PATCH|DELETE)/)) {
        inFunction = true
        hasResolvedParams = false
      }
      
      if (inFunction && lines[i].includes('const resolvedParams = await params')) {
        hasResolvedParams = true
      }
      
      if (inFunction && hasResolvedParams && lines[i].includes('params.')) {
        lines[i] = lines[i].replace(/params\.([a-zA-Z]+)/g, 'resolvedParams.$1')
        modified = true
      }
      
      if (inFunction && lines[i].match(/^\s*\}\s*$/)) {
        inFunction = false
        hasResolvedParams = false
      }
    }
    
    content = lines.join('\n')
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

