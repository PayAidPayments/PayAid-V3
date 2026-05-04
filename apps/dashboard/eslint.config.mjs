import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const next = require('eslint-config-next')

/**
 * Next.js 16 removed `next lint`; use ESLint CLI with the official flat preset.
 * @see https://nextjs.org/docs/app/api-reference/config/eslint
 */
/** `react/*` rules must sit in the same flat-config block as `plugins.react` (the `name: 'next'` block in `eslint-config-next`). */
const nextConfigs = [...next]

/** Local Next build / verify artifacts (must not be ESLint targets; files can be huge). */
const localBuildArtifactIgnores = {
  ignores: [
    '.next/**',
    'out/**',
    'node_modules/**',
    '.next-build-verify/**',
    '.next-full-surface*/**',
    'coverage/**',
  ],
}

export default [
  localBuildArtifactIgnores,
  ...nextConfigs.map((block) =>
  block && block.name === 'next'
    ? {
        ...block,
        rules: {
          ...(block.rules ?? {}),
          'react/jsx-key': 'warn',
          'react/display-name': 'warn',
          // Temporarily lowered to warnings while we burn down legacy app-router migration debt.
          'react/no-unescaped-entities': 'warn',
          'react-hooks/set-state-in-effect': 'warn',
        },
      }
    : block
  ),
]
