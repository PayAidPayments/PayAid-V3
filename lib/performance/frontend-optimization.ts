/**
 * Frontend performance optimization utilities
 */

/**
 * Lazy load component
 */
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFn)
}

/**
 * Code splitting configuration for Next.js
 */
export const codeSplittingConfig = {
  // Split large components
  largeComponents: [
    'components/crm/DealPipeline.tsx',
    'components/crm/ContactList.tsx',
    'components/email/EmailComposeDialog.tsx',
  ],

  // Split heavy libraries
  heavyLibraries: [
    'recharts',
    'react-dnd',
    'react-quill',
  ],
}

/**
 * Image optimization configuration
 */
export const imageOptimization = {
  formats: ['webp', 'avif'],
  sizes: {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
  },
  quality: 85,
}

/**
 * Bundle size optimization tips
 */
export const bundleOptimizationTips = [
  'Use dynamic imports for heavy components',
  'Tree-shake unused exports',
  'Use Next.js Image component for images',
  'Enable compression (gzip/brotli)',
  'Minify CSS and JavaScript',
  'Remove unused dependencies',
  'Use React.memo for expensive components',
  'Implement virtual scrolling for long lists',
]
