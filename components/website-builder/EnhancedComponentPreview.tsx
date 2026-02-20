'use client'

import { useEffect, useRef, useState, ErrorInfo, Component, ReactNode } from 'react'
import { AlertCircle, Monitor, Tablet, Smartphone, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'

interface ComponentPreviewProps {
  code: string
  componentName: string
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

interface ViewportConfig {
  width: string
  height: string
  scale: number
}

const viewportConfigs: Record<ViewportSize, ViewportConfig> = {
  desktop: { width: '100%', height: '100%', scale: 1 },
  tablet: { width: '768px', height: '1024px', scale: 0.8 },
  mobile: { width: '375px', height: '667px', scale: 0.6 },
}

/**
 * Error Boundary Component
 */
class PreviewErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Preview error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Component failed to render</p>
              <p className="text-sm">{this.state.error?.message || 'Unknown error occurred'}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

/**
 * Enhanced Component Preview with responsive view, zoom, and error boundary
 */
export function EnhancedComponentPreview({ code, componentName }: ComponentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [zoom, setZoom] = useState(100)
  const [renderKey, setRenderKey] = useState(0)

  const viewportConfig = viewportConfigs[viewport]

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
  }, [code, componentName, renderKey])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const handleRetry = () => {
    setRenderKey((prev) => prev + 1)
    setError(null)
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RotateCcw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <PreviewErrorBoundary onError={(error) => setError(error.message)}>
      <div className="border rounded-lg bg-white overflow-hidden">
        {/* Preview Controls */}
        <div className="border-b bg-gray-50 p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Viewport:</span>
            <div className="flex gap-1">
              <Button
                variant={viewport === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewport('desktop')}
                title="Desktop (100%)"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewport('tablet')}
                title="Tablet (768px)"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewport('mobile')}
                title="Mobile (375px)"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Zoom:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <CustomSelect value={zoom.toString()} onValueChange={(v: string) => setZoom(Number(v))} placeholder="Zoom">
                <CustomSelectTrigger className="w-20 h-8">
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="50">50%</CustomSelectItem>
                  <CustomSelectItem value="75">75%</CustomSelectItem>
                  <CustomSelectItem value="100">100%</CustomSelectItem>
                  <CustomSelectItem value="125">125%</CustomSelectItem>
                  <CustomSelectItem value="150">150%</CustomSelectItem>
                  <CustomSelectItem value="200">200%</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                title="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Container */}
        <div
          ref={containerRef}
          className="relative bg-gray-100 p-4 flex items-center justify-center overflow-auto"
          style={{ minHeight: '500px', maxHeight: '800px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-sm text-muted-foreground">Loading preview...</div>
            </div>
          )}
          <div
            className="bg-white shadow-lg transition-all duration-200"
            style={{
              width: viewportConfig.width,
              minHeight: viewportConfig.height,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              ref={iframeRef}
              className="w-full border-0"
              title={`${componentName} Preview`}
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: viewportConfig.width,
                minHeight: viewportConfig.height,
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
            />
          </div>
        </div>
      </div>
    </PreviewErrorBoundary>
  )
}

