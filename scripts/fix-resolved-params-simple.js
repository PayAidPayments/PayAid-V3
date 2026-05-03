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
    } catch (e) {}
  })
  return fileList
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false
  
  // Check if file uses resolvedParams but might be missing declaration
  if (!content.includes('resolvedParams.') || !content.includes('params: Promise')) {
    return false
  }
  
  // Split by export async function
  const lines = content.split('\n')
  let inFunction = false
  let hasResolvedParams = false
  let functionStart = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect function start
    if (line.match(/export async function (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/)) {
      inFunction = true
      hasResolvedParams = false
      functionStart = i
    }
    
    // Check if resolvedParams is declared in this function
    if (inFunction && line.includes('const resolvedParams = await params')) {
      hasResolvedParams = true
    }
    
    // If we see resolvedParams usage but no declaration, add it
    if (inFunction && !hasResolvedParams && line.includes('resolvedParams.')) {
      // Find the try block
      for (let j = functionStart; j < i; j++) {
        if (lines[j].trim() === 'try {') {
          // Add resolvedParams after try {
          const indent = lines[j].match(/^(\s*)/)?.[1] || '    '
          lines.splice(j + 1, 0, `${indent}const resolvedParams = await params`)
          modified = true
          hasResolvedParams = true
          break
        }
      }
    }
    
    // Reset on function end
    if (inFunction && line.trim() === '}') {
      inFunction = false
      hasResolvedParams = false
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
    console.log(`Fixed: ${filePath}`)
    return true
  }
  
  return false
}

const files = findFiles('app/api')
let fixedCount = 0

files.forEach(file => {
  try {
    if (fixFile(file)) {
      fixedCount++
    }
  } catch (e) {
    console.error(`Error: ${file}`, e.message)
  }
})

console.log(`\nFixed ${fixedCount} files`)

