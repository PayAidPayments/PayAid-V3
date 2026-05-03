import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const next = require('eslint-config-next')

/**
 * Next.js 16 removed `next lint`; use ESLint CLI with the official flat preset.
 * Match dashboard rule severity so CI stays green while legacy CRM pages are migrated.
 */
/** `react/*` rules must sit in the same flat-config block as `plugins.react` (the `name: 'next'` block in `eslint-config-next`). */
const nextConfigs = [...next]

const localBuildArtifactIgnores = {
  ignores: ['.next/**', 'out/**', 'node_modules/**', 'coverage/**'],
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
            'react/no-unescaped-entities': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
          },
        }
      : block
  ),
]
