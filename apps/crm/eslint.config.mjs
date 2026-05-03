import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const next = require('eslint-config-next')

/** Next.js 16: use ESLint flat config with the official preset (same pattern as apps/dashboard). */
export default [...next]
