/**
 * Vector Logo Engine
 * 
 * Wrapper around manicinc/logomaker for PayAid V3 integration.
 * This provides a clean API for generating vector logos with SVG and PNG exports.
 * 
 * @license MIT
 * @see https://github.com/manicinc/logomaker
 */

export interface LogoGradient {
  type: 'linear' | 'radial'
  colors: string[]
  angle?: number
}

export interface LogoShadow {
  x: number
  y: number
  blur: number
  color: string
}

export interface LogoOutline {
  width: number
  color: string
}

export interface LogoBackground {
  type: 'color' | 'pattern' | 'transparent'
  value: string
}

export interface LogoLayout {
  align: 'left' | 'center' | 'right'
  offsetX: number
  offsetY: number
  rotation: number
}

export interface LogoConfig {
  text: string
  fontFamily: string
  fontSize: number
  color: string
  gradient?: LogoGradient
  shadow?: LogoShadow
  outline?: LogoOutline
  animation?: 'none' | 'pulse' | 'bounce' | 'glitch' | 'rotate' | 'shake' | 'glow'
  background?: LogoBackground
  layout?: LogoLayout
}

export interface FontInfo {
  family: string
  license: string
  category?: string
  variants?: string[]
}

export class VectorLogoEngine {
  /**
   * Generate SVG with embedded fonts and CSS animations
   * 
   * @param config - Logo configuration
   * @returns SVG string with embedded fonts and animations
   */
  async generateSVG(config: LogoConfig): Promise<string> {
    const {
      text,
      fontFamily,
      fontSize,
      color,
      gradient,
      shadow,
      outline,
      animation,
      background,
      layout,
    } = config

    // SVG dimensions
    const width = 1024
    const height = 1024
    const centerX = width / 2
    const centerY = height / 2

    // Calculate text position
    const align = layout?.align || 'center'
    let textAnchor = 'middle'
    let x = centerX + (layout?.offsetX || 0)
    const y = centerY + (layout?.offsetY || 0)

    if (align === 'left') {
      textAnchor = 'start'
      x = 50 + (layout?.offsetX || 0)
    } else if (align === 'right') {
      textAnchor = 'end'
      x = width - 50 + (layout?.offsetX || 0)
    }

    // Build SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>`

    // Add font face (will be replaced with actual font data from logomaker)
    svg += `
    <style type="text/css">
      @font-face {
        font-family: '${fontFamily}';
        src: url('data:font/woff2;base64,PLACEHOLDER_FONT_DATA');
      }
    </style>`

    // Add gradient if specified
    if (gradient) {
      const gradientId = 'textGradient'
      if (gradient.type === 'linear') {
        const angle = gradient.angle || 0
        const rad = (angle * Math.PI) / 180
        const x1 = 50 - 50 * Math.cos(rad)
        const y1 = 50 - 50 * Math.sin(rad)
        const x2 = 50 + 50 * Math.cos(rad)
        const y2 = 50 + 50 * Math.sin(rad)

        svg += `
    <linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`
        gradient.colors.forEach((color, i) => {
          const offset = (i / (gradient.colors.length - 1)) * 100
          svg += `
      <stop offset="${offset}%" stop-color="${color}" />`
        })
        svg += `
    </linearGradient>`
      } else {
        svg += `
    <radialGradient id="${gradientId}">`
        gradient.colors.forEach((color, i) => {
          const offset = (i / (gradient.colors.length - 1)) * 100
          svg += `
      <stop offset="${offset}%" stop-color="${color}" />`
        })
        svg += `
    </radialGradient>`
      }
    }

    // Add shadow filter if specified
    if (shadow) {
      svg += `
    <filter id="textShadow">
      <feDropShadow dx="${shadow.x}" dy="${shadow.y}" stdDeviation="${shadow.blur}" flood-color="${shadow.color}" />
    </filter>`
    }

    // Add CSS animations if specified
    if (animation && animation !== 'none') {
      svg += `
    <style type="text/css">
      @keyframes ${animation} {`
      
      switch (animation) {
        case 'pulse':
          svg += `
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }`
          break
        case 'bounce':
          svg += `
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }`
          break
        case 'glitch':
          svg += `
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(2px, -2px); }
        60% { transform: translate(-2px, -2px); }
        80% { transform: translate(2px, 2px); }`
          break
        case 'rotate':
          svg += `
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }`
          break
        case 'shake':
          svg += `
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }`
          break
        case 'glow':
          svg += `
        0%, 100% { filter: drop-shadow(0 0 5px ${color}); }
        50% { filter: drop-shadow(0 0 20px ${color}); }`
          break
      }
      
      svg += `
      }
      .animated-text {
        animation: ${animation} 2s ease-in-out infinite;
        transform-origin: center center;
        transform-box: fill-box;
      }
    </style>`
    }

    svg += `
  </defs>`

    // Add background if specified
    if (background && background.type !== 'transparent') {
      svg += `
  <rect width="${width}" height="${height}" fill="${background.value}" />`
    }

    // Build text element
    let textStyle = `font-family: '${fontFamily}'; font-size: ${fontSize}px;`
    let textFill = gradient ? `url(#textGradient)` : color
    let textFilter = shadow ? `filter="url(#textShadow)"` : ''
    let textClass = animation && animation !== 'none' ? `class="animated-text"` : ''

    svg += `
  <text x="${x}" y="${y}" text-anchor="${textAnchor}" dominant-baseline="middle" style="${textStyle}" fill="${textFill}" ${textFilter} ${textClass}>`

    // Add outline if specified
    if (outline) {
      svg += `
    <tspan style="stroke: ${outline.color}; stroke-width: ${outline.width}; fill: none;">${text}</tspan>
    <tspan>${text}</tspan>`
    } else {
      svg += text
    }

    svg += `
  </text>
</svg>`

    return svg
  }

  /**
   * Generate PNG at specified size
   * 
   * Note: This is a placeholder. In production, you should:
   * 1. Use logomaker's canvas rendering on the client side, OR
   * 2. Use a server-side SVG-to-PNG converter like sharp or puppeteer
   * 
   * @param config - Logo configuration
   * @param size - Output size in pixels (width = height)
   * @returns PNG buffer
   */
  async generatePNG(config: LogoConfig, size: number): Promise<Buffer> {
    // For now, return a note that PNG generation should be done client-side
    // or via a separate image conversion service
    throw new Error(
      'PNG generation should be done client-side using logomaker canvas renderer. ' +
      'This server-side method is a placeholder. ' +
      'See implementation guide for client-side PNG export.'
    )
  }

  /**
   * Get list of available fonts
   * 
   * Note: This should load from logomaker's font index.
   * For now, returns a subset of common fonts.
   * 
   * @returns Array of font information
   */
  async getAvailableFonts(): Promise<FontInfo[]> {
    // TODO: Load from logomaker's fonts/index.json after integration
    // For now, return common web-safe fonts plus popular Google Fonts
    return [
      { family: 'Inter', license: 'OFL', category: 'sans-serif' },
      { family: 'Roboto', license: 'Apache 2.0', category: 'sans-serif' },
      { family: 'Poppins', license: 'OFL', category: 'sans-serif' },
      { family: 'Montserrat', license: 'OFL', category: 'sans-serif' },
      { family: 'Open Sans', license: 'Apache 2.0', category: 'sans-serif' },
      { family: 'Lato', license: 'OFL', category: 'sans-serif' },
      { family: 'Raleway', license: 'OFL', category: 'sans-serif' },
      { family: 'Playfair Display', license: 'OFL', category: 'serif' },
      { family: 'Merriweather', license: 'OFL', category: 'serif' },
      { family: 'Oswald', license: 'OFL', category: 'sans-serif' },
      { family: 'Source Sans Pro', license: 'OFL', category: 'sans-serif' },
      { family: 'Nunito', license: 'OFL', category: 'sans-serif' },
      { family: 'Ubuntu', license: 'Ubuntu Font License', category: 'sans-serif' },
      { family: 'PT Sans', license: 'OFL', category: 'sans-serif' },
      { family: 'Quicksand', license: 'OFL', category: 'sans-serif' },
    ]
  }

  /**
   * Load font data from logomaker
   * 
   * This will be implemented after logomaker integration.
   * Should fetch font from logomaker's font chunks.
   * 
   * @param fontFamily - Font family name
   * @returns Base64 encoded font data
   */
  async loadFontData(fontFamily: string): Promise<string> {
    // TODO: Implement font loading from logomaker's font chunks
    // For now, return placeholder
    return 'PLACEHOLDER_FONT_DATA'
  }

  /**
   * Embed font data into SVG
   * 
   * Replaces placeholder with actual font data
   * 
   * @param svg - SVG string with placeholder
   * @param fontFamily - Font family to embed
   * @returns SVG with embedded font
   */
  async embedFontInSVG(svg: string, fontFamily: string): Promise<string> {
    const fontData = await this.loadFontData(fontFamily)
    return svg.replace('PLACEHOLDER_FONT_DATA', fontData)
  }
}

/**
 * Singleton instance
 */
export const vectorLogoEngine = new VectorLogoEngine()
