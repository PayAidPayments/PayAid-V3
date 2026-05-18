import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Webpack aliases for PayAid module apps: legacy `@/` + app-scoped `@<app>/` and `@app/`.
 * @param {import('webpack').Configuration} config
 * @param {string} appDir absolute or relative app directory (e.g. apps/crm)
 * @param {string} appSlug e.g. crm, dashboard, voice
 */
export function applyMonorepoWebpackAliases(config, appDir, appSlug) {
  const appRoot = path.resolve(appDir)
  const repoRoot = path.resolve(appRoot, '../..')
  config.resolve = config.resolve || {}
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@': repoRoot,
    '@app': path.join(appRoot, 'app'),
    [`@${appSlug}`]: path.join(appRoot, 'app'),
  }
  return config
}

export function repoRootFromAppDir(appDir) {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
}
