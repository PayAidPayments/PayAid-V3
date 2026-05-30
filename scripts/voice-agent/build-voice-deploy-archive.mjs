#!/usr/bin/env node
/**
 * Build a minimal monorepo tree for Vercel voice deploy (git archive + operator files).
 * Default output: D:\Temp\payaid-voice-deploy (no spaces in path).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, copyFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** Tracked paths required for root install/postinstall + Vercel voice build. */
export const VOICE_DEPLOY_ARCHIVE_PATHS = [
  'package.json',
  'package-lock.json',
  'scripts',
  'prisma',
  'contexts',
  'apps/voice',
  'apps/dashboard/app/api/auth/login',
  'apps/dashboard/app/api/auth/me',
  'packages',
  'lib',
  'components',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
]

const workDir =
  process.env.VERCEL_VOICE_DEPLOY_WORKDIR ||
  (process.platform === 'win32' ? 'D:\\Temp\\payaid-voice-deploy' : path.join('/tmp', 'payaid-voice-deploy'))

const tgzPath = path.join(workDir, 'source.tgz')

if (existsSync(workDir)) {
  rmSync(workDir, { recursive: true, force: true })
}
mkdirSync(workDir, { recursive: true })

console.log(
  JSON.stringify({ step: 'git-archive', workDir, archivePaths: VOICE_DEPLOY_ARCHIVE_PATHS }, null, 2),
)

const archive = spawnSync(
  'git',
  ['archive', '--format=tar.gz', '-o', tgzPath, 'HEAD', ...VOICE_DEPLOY_ARCHIVE_PATHS],
  { cwd: root, stdio: 'inherit' },
)
if (archive.status !== 0) process.exit(archive.status ?? 1)

const extract = spawnSync('tar', ['-xzf', tgzPath, '-C', workDir], { stdio: 'inherit', shell: true })
if (extract.status !== 0) process.exit(extract.status ?? 1)

for (const name of ['.vercelignore', 'vercel-voice.json']) {
  const src = path.join(root, name)
  if (existsSync(src)) copyFileSync(src, path.join(workDir, name))
}
mkdirSync(path.join(workDir, '.vercel'), { recursive: true })
copyFileSync(
  path.join(root, '.vercel', 'project.json'),
  path.join(workDir, '.vercel', 'project.json'),
)

function topLevelManifest(dir) {
  return readdirSync(dir).map((name) => {
    const p = path.join(dir, name)
    const st = statSync(p)
    return { name, type: st.isDirectory() ? 'dir' : 'file' }
  })
}

console.log(
  JSON.stringify(
    {
      ok: true,
      workDir,
      manifest: topLevelManifest(workDir),
      hasScriptsPrismaGenerate: existsSync(
        path.join(workDir, 'scripts', 'prisma-generate-with-retry.js'),
      ),
      hasPackagesDbSchema: existsSync(
        path.join(workDir, 'packages', 'db', 'prisma', 'schema.prisma'),
      ),
      hasContextsModuleContext: existsSync(
        path.join(workDir, 'contexts', 'ModuleContext.tsx'),
      ),
    },
    null,
    2,
  ),
)
