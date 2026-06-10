#!/usr/bin/env node
/**
 * Build a minimal monorepo tree for Vercel voice deploy (git archive + operator files).
 * Default output: D:\Temp\payaid-voice-deploy (no spaces in path).
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
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
  'public/logo.png',
]

const workDir =
  process.env.VERCEL_VOICE_DEPLOY_WORKDIR ||
  (process.platform === 'win32' ? 'D:\\Temp\\payaid-voice-deploy' : path.join('/tmp', 'payaid-voice-deploy'))

const tgzPath = path.join(workDir, 'source.tgz')

function prepareWorkDir(dir) {
  if (existsSync(dir) && process.env.VOICE_DEPLOY_SKIP_RM !== '1') {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : ''
      if (code !== 'EBUSY' && code !== 'EPERM') throw error
      console.warn(
        JSON.stringify({ warning: 'workDir_locked', workDir: dir, action: 'incremental_copy' }),
      )
    }
  }
  mkdirSync(dir, { recursive: true })
}

prepareWorkDir(workDir)

const useCopy = process.env.VOICE_DEPLOY_USE_COPY === '1'
console.log(
  JSON.stringify(
    { step: useCopy ? 'fs-copy' : 'git-archive', workDir, archivePaths: VOICE_DEPLOY_ARCHIVE_PATHS },
    null,
    2,
  ),
)

if (useCopy) {
  for (const rel of VOICE_DEPLOY_ARCHIVE_PATHS) {
    const src = path.join(root, rel)
    const dest = path.join(workDir, rel)
    if (!existsSync(src)) {
      console.error(JSON.stringify({ ok: false, error: 'missing path', rel }))
      process.exit(1)
    }
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(src, dest, { recursive: true })
  }
} else {
  const archive = spawnSync(
    'git',
    ['archive', '--format=tar.gz', '-o', tgzPath, 'HEAD', ...VOICE_DEPLOY_ARCHIVE_PATHS],
    { cwd: root, stdio: 'inherit' },
  )
  if (archive.status !== 0) process.exit(archive.status ?? 1)

  const extract = spawnSync('tar', ['-xzf', tgzPath, '-C', workDir], { stdio: 'inherit', shell: true })
  if (extract.status !== 0) process.exit(extract.status ?? 1)
}

for (const name of ['.vercelignore', 'vercel-voice.json']) {
  const src = path.join(root, name)
  if (existsSync(src)) copyFileSync(src, path.join(workDir, name))
}
mkdirSync(path.join(workDir, '.vercel'), { recursive: true })
copyFileSync(
  path.join(root, '.vercel', 'project.json'),
  path.join(workDir, '.vercel', 'project.json'),
)

// Next.js serves static files from apps/voice/public only.
const voicePublicDir = path.join(workDir, 'apps', 'voice', 'public')
const voiceLogo = path.join(voicePublicDir, 'logo.png')
if (!existsSync(voiceLogo)) {
  const rootLogo = path.join(workDir, 'public', 'logo.png')
  if (existsSync(rootLogo)) {
    mkdirSync(voicePublicDir, { recursive: true })
    copyFileSync(rootLogo, voiceLogo)
  }
}

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
