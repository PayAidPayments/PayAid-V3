import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const next = require('eslint-config-next')

/**
 * Next.js 16 removed `next lint`; use ESLint CLI with the official flat preset.
 * @see https://nextjs.org/docs/app/api-reference/config/eslint
 */
const config = [...next]

export default config
