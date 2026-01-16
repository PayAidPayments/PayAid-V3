/**
 * PayAid Brand Configuration
 * Centralized brand assets and configuration
 */

export const brandConfig = {
  name: 'PayAid',
  version: 'V3',
  fullName: 'PayAid V3',
  tagline: 'Business Operating System',
  
  // Logo Configuration
  logo: {
    // Logo image URL - Using local file from public folder
    imageUrl: '/logo.png', // Local logo file
    // Text logo fallback (used when imageUrl is null or image fails to load)
    useTextLogo: true,
    textLogo: 'PayAid',
    // Website URL for reference (not used as image)
    websiteUrl: 'https://payaid-v3.vercel.app/',
  },
  
  // Brand Colors
  colors: {
    primary: {
      purple: '#53328A',
      'purple-dark': '#3F1F62',
      'purple-hover': '#3F1F62',
    },
    secondary: {
      gold: '#F5C700',
      'gold-hover': '#E0B200',
    },
    accent: {
      charcoal: '#414143',
    },
  },
  
  // Gradient
  gradient: {
    primary: 'from-[#53328A] to-[#F5C700]',
    text: 'bg-gradient-to-r from-[#53328A] to-[#F5C700] bg-clip-text text-transparent',
  },
}

