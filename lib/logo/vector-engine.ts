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
  lockupType?: 'combination-horizontal' | 'stacked' | 'wordmark' | 'emblem'
}

export interface LogoConfig {
  text: string
  fontFamily: string
  fontSize: number
  color: string
  iconStyle?: 'none' | 'circle-monogram' | 'diamond' | 'spark' | 'shield' | 'hex'
  iconColor?: string
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
      iconStyle,
      iconColor,
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
    const lockupType = layout?.lockupType || 'combination-horizontal'
    let textAnchor = 'middle'
    let x = centerX + (layout?.offsetX || 0)
    let y = centerY + (layout?.offsetY || 0)

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

    const selectedIconStyle = iconStyle || 'circle-monogram'
    const iconFill = iconColor || color
    const hasIcon = lockupType !== 'wordmark' && selectedIconStyle !== 'none'
    const isStacked = lockupType === 'stacked'
    const isEmblem = lockupType === 'emblem'

    const renderIcon = () => {
      if (!hasIcon) return ''
      const iconSize = Math.max(72, Math.min(140, Math.round(fontSize * 1.4)))
      const iconX = isStacked || isEmblem ? x : Math.max(70, x - iconSize * 0.9)
      const iconY = isStacked ? y - iconSize * 0.8 : y
      if (selectedIconStyle === 'circle-monogram') {
        const monogram = (text || '?').trim().charAt(0).toUpperCase()
        return `
  <g transform="translate(${iconX}, ${iconY})">
    <circle cx="0" cy="0" r="${Math.round(iconSize / 2)}" fill="${iconFill}" opacity="0.15" />
    <circle cx="0" cy="0" r="${Math.round(iconSize / 2 - 4)}" fill="none" stroke="${iconFill}" stroke-width="4" />
    <text x="0" y="2" text-anchor="middle" dominant-baseline="middle" fill="${iconFill}" style="font-family: '${fontFamily}'; font-size: ${Math.round(iconSize * 0.42)}px; font-weight: 700;">${monogram}</text>
  </g>`
      }
      if (selectedIconStyle === 'diamond') {
        const s = Math.round(iconSize / 2)
        return `
  <g transform="translate(${iconX}, ${iconY})">
    <polygon points="0,${-s} ${s},0 0,${s} ${-s},0" fill="${iconFill}" opacity="0.15" />
    <polygon points="0,${-s + 8} ${s - 8},0 0,${s - 8} ${-s + 8},0" fill="none" stroke="${iconFill}" stroke-width="4" />
  </g>`
      }
      if (selectedIconStyle === 'shield') {
        const s = Math.round(iconSize / 2)
        return `
  <g transform="translate(${iconX}, ${iconY})">
    <path d="M0,${-s} L${s * 0.8},${-s * 0.25} L${s * 0.62},${s * 0.55} L0,${s} L${-s * 0.62},${s * 0.55} L${-s * 0.8},${-s * 0.25} Z" fill="${iconFill}" opacity="0.15" />
    <path d="M0,${-s + 8} L${s * 0.65},${-s * 0.2} L${s * 0.5},${s * 0.45} L0,${s - 8} L${-s * 0.5},${s * 0.45} L${-s * 0.65},${-s * 0.2} Z" fill="none" stroke="${iconFill}" stroke-width="4" />
  </g>`
      }
      if (selectedIconStyle === 'hex') {
        const s = Math.round(iconSize / 2)
        return `
  <g transform="translate(${iconX}, ${iconY})">
    <polygon points="${-s * 0.86},${-s * 0.5} 0,${-s} ${s * 0.86},${-s * 0.5} ${s * 0.86},${s * 0.5} 0,${s} ${-s * 0.86},${s * 0.5}" fill="${iconFill}" opacity="0.15" />
    <polygon points="${-s * 0.72},${-s * 0.42} 0,${-s * 0.84} ${s * 0.72},${-s * 0.42} ${s * 0.72},${s * 0.42} 0,${s * 0.84} ${-s * 0.72},${s * 0.42}" fill="none" stroke="${iconFill}" stroke-width="4" />
  </g>`
      }
      // spark
      return `
  <g transform="translate(${iconX}, ${y})">
    <path d="M0 -42 L10 -10 L42 0 L10 10 L0 42 L-10 10 L-42 0 L-10 -10 Z" fill="${iconFill}" opacity="0.16" />
    <path d="M0 -32 L8 -8 L32 0 L8 8 L0 32 L-8 8 L-32 0 L-8 -8 Z" fill="none" stroke="${iconFill}" stroke-width="4" />
  </g>`
    }

    if (isStacked) {
      y = y + Math.max(56, Math.round(fontSize * 0.9))
      textAnchor = 'middle'
    }
    if (isEmblem) {
      y = y + Math.max(72, Math.round(fontSize * 1.05))
      textAnchor = 'middle'
    }

    // Build text element
    let textStyle = `font-family: '${fontFamily}'; font-size: ${fontSize}px;`
    if (isEmblem) {
      textStyle = `font-family: '${fontFamily}'; font-size: ${Math.max(24, Math.round(fontSize * 0.6))}px; font-weight: 600;`
    }
    let textFill = gradient ? `url(#textGradient)` : color
    let textFilter = shadow ? `filter="url(#textShadow)"` : ''
    let textClass = animation && animation !== 'none' ? `class="animated-text"` : ''

    svg += renderIcon()

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
