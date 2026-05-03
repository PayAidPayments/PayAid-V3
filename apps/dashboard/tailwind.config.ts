import type { Config } from 'tailwindcss'
import rootConfig from '../../tailwind.config'

/**
 * Dashboard app Tailwind config.
 * Content must include monorepo root (components, lib) because dashboard
 * imports from @/ which resolves to root; otherwise Tailwind purges those
 * classes and the page renders unstyled (e.g. /home/[tenantId]).
 */
const config: Config = {
  darkMode: rootConfig.darkMode ?? 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: rootConfig.theme ?? {},
  plugins: rootConfig.plugins ?? [],
}
export default config
