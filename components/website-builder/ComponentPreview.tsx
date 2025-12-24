'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ComponentPreviewProps {
  code: string
  componentName: string
}

/**
 * Safely renders React components from generated code
 * Uses iframe for isolation and security
 */
export function ComponentPreview({ code, componentName }: ComponentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    setIsLoading(true)
    setError(null)

    try {
      // Clean the code - remove export statements and extract component
      let cleanCode = code
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+(const|function)\s+/g, '$1 ')
        .replace(/export\s+/g, '')

      // Try to extract component name from code
      const componentMatch = cleanCode.match(/(?:const|function)\s+(\w+)/)
      const extractedName = componentMatch ? componentMatch[1] : componentName

      // Create a safe HTML document with React and Tailwind
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName} Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      background: white;
    }
    #root {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    try {
      ${cleanCode}
      
      // Try to find the component
      const Component = typeof ${extractedName} !== 'undefined' 
        ? ${extractedName} 
        : (typeof window !== 'undefined' && window.${extractedName})
        ? window.${extractedName}
        : null;
      
      if (Component && typeof Component === 'function') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component));
      } else {
        document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #ef4444;">Component "${extractedName}" not found. Please check the code.</div>';
      }
    } catch (err) {
      document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #ef4444;">Error: ' + err.message + '</div>';
      console.error('Component render error:', err);
    }
  </script>
</body>
</html>
      `

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(html)
        iframeDoc.close()

        // Wait for iframe to load
        iframe.onload = () => {
          setTimeout(() => {
            setIsLoading(false)
          }, 500)
        }
      } else {
        setIsLoading(false)
        setError('Unable to access iframe document')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render component')
      setIsLoading(false)
    }
  }, [code, componentName])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[400px] border rounded-lg overflow-hidden bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-sm text-muted-foreground">Loading preview...</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title={`${componentName} Preview`}
        sandbox="allow-scripts allow-same-origin"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}

