module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    // PayAid Brand Enforcement Rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      plugins: ['payaid-brand-enforcement'],
      rules: {
        'payaid-brand-enforcement/no-dollar-symbols': 'error',
      },
    },
  ],
  settings: {
    'payaid-brand-enforcement': {
      // Custom plugin settings
    },
  },
}
