/**
 * PayAid Brand Color Generator
 * Generates 10 shades (50-950) for PayAid brand colors
 */

/**
 * Generate color shades from base color
 * Returns 10 shades from lightest (50) to darkest (950)
 */
function generateColorShades(baseColor: string): Record<number, string> {
  // This is a simplified version - in production, use a proper color manipulation library
  // For now, we'll define the shades manually based on the brand colors
  
  // Purple shades (#53328A)
  if (baseColor === '#53328A') {
    return {
      50: '#F5F3F9',
      100: '#E8E3F0',
      200: '#D1C7E1',
      300: '#BAABD2',
      400: '#A38FC3',
      500: '#53328A', // Base
      600: '#4A2D7A',
      700: '#3F1F62',
      800: '#341A4F',
      900: '#29143C',
      950: '#1E0F29',
    }
  }
  
  // Gold shades (#F5C700)
  if (baseColor === '#F5C700') {
    return {
      50: '#FFFDF0',
      100: '#FFFBE0',
      200: '#FFF7C0',
      300: '#FFF3A0',
      400: '#FFEF80',
      500: '#F5C700', // Base
      600: '#E0B200',
      700: '#CC9D00',
      800: '#B88800',
      900: '#A37300',
      950: '#8F5E00',
    }
  }
  
  return {}
}

export const payaidPurple = generateColorShades('#53328A')
export const payaidGold = generateColorShades('#F5C700')

// Export base colors
export const PAYAID_PURPLE = '#53328A'
export const PAYAID_GOLD = '#F5C700'
