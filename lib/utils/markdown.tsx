import React from 'react'

export function parseMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const elements: React.ReactElement[] = []
  let currentParagraph: string[] = []
  let inList = false
  let listItems: string[] = []
  let listType: 'ul' | 'ol' = 'ul'

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ')
      if (text.trim()) {
        elements.push(
          <p key={elements.length} className="text-gray-700 leading-relaxed mb-4">
            {parseInlineMarkdown(text)}
          </p>
        )
      }
      currentParagraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ul' ? 'ul' : 'ol'
      elements.push(
        <ListTag key={elements.length} className={`list-${listType === 'ul' ? 'disc' : 'decimal'} list-inside space-y-2 text-gray-700 mb-4`}>
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      )
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Headings
    if (line.startsWith('# ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h1 key={elements.length} className="text-4xl font-bold mt-12 mb-6" style={{ color: '#53328A' }}>
          {line.substring(2)}
        </h1>
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h2 key={elements.length} className="text-3xl font-bold mt-10 mb-5" style={{ color: '#53328A' }}>
          {line.substring(3)}
        </h2>
      )
      continue
    }
    if (line.startsWith('### ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h3 key={elements.length} className="text-2xl font-bold mt-8 mb-4" style={{ color: '#53328A' }}>
          {line.substring(4)}
        </h3>
      )
      continue
    }
    if (line.startsWith('#### ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h4 key={elements.length} className="text-xl font-bold mt-6 mb-3" style={{ color: '#53328A' }}>
          {line.substring(5)}
        </h4>
      )
      continue
    }

    // Images
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      flushParagraph()
      flushList()
      elements.push(
        <img key={elements.length} src={imageMatch[2]} alt={imageMatch[1]} className="rounded-lg my-8 w-full" />
      )
      continue
    }

    // Lists
    if (line.match(/^[-*] /)) {
      flushParagraph()
      if (!inList) {
        listType = 'ul'
        inList = true
      }
      listItems.push(line.substring(2))
      continue
    }
    if (line.match(/^\d+\. /)) {
      flushParagraph()
      if (!inList) {
        listType = 'ol'
        inList = true
      }
      listItems.push(line.replace(/^\d+\. /, ''))
      continue
    }

    // Empty line
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    // Regular paragraph
    if (inList) {
      flushList()
    }
    currentParagraph.push(line)
  }

  flushParagraph()
  flushList()

  return elements
}

function parseInlineMarkdown(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = []
  let remaining = text
  let key = 0

  // Process bold
  const boldRegex = /\*\*([^*]+)\*\*/g
  let lastIndex = 0
  let match

  while ((match = boldRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.substring(lastIndex, match.index))
    }
    parts.push(
      <strong key={key++} className="font-bold" style={{ color: '#53328A' }}>
        {match[1]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < remaining.length) {
    parts.push(remaining.substring(lastIndex))
  }

  // Process links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const processedParts: (string | React.ReactElement)[] = []
  
  for (const part of parts) {
    if (typeof part === 'string') {
      let partText = part
      let partLastIndex = 0
      let linkMatch

      while ((linkMatch = linkRegex.exec(partText)) !== null) {
        if (linkMatch.index > partLastIndex) {
          processedParts.push(partText.substring(partLastIndex, linkMatch.index))
        }
        processedParts.push(
          <a key={key++} href={linkMatch[2]} className="text-purple-600 hover:text-purple-800 underline">
            {linkMatch[1]}
          </a>
        )
        partLastIndex = linkMatch.index + linkMatch[0].length
      }
      if (partLastIndex < partText.length) {
        processedParts.push(partText.substring(partLastIndex))
      }
    } else {
      processedParts.push(part)
    }
  }

  return processedParts.length > 0 ? processedParts : [text]
}

