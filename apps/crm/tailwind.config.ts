import type { Config } from 'tailwindcss'
import rootConfig from '../../tailwind.config'

const { content: _rootContent, ...rest } = rootConfig as Config

/**
 * Monorepo root Tailwind theme + CRM-relative content paths (root `./app` is not
 * apps/crm when this config file lives here).
 */
const config: Config = {
  ...rest,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}

export default config
