import type { Config } from 'tailwindcss'
import rootConfig from '../../tailwind.config'
import { moduleNamedLibTailwindContent } from '../../scripts/tailwind-monorepo-content.mjs'

const config: Config = {
  darkMode: rootConfig.darkMode ?? 'class',
  content: moduleNamedLibTailwindContent('projects'),
  theme: rootConfig.theme ?? {},
  plugins: rootConfig.plugins ?? [],
}
export default config
