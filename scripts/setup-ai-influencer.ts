/**
 * Setup script for AI Influencer Marketing
 * Checks dependencies and creates necessary directories
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version')
    console.log('✅ FFmpeg is installed')
    return true
  } catch {
    console.warn('❌ FFmpeg is not installed')
    console.warn('   Install from: https://ffmpeg.org/download.html')
    console.warn('   Windows: choco install ffmpeg')
    console.warn('   macOS: brew install ffmpeg')
    console.warn('   Linux: sudo apt-get install ffmpeg')
    return false
  }
}

async function checkRhubarb() {
  const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb'
  try {
    await execAsync(`"${rhubarbPath}" --version`)
    console.log('✅ Rhubarb Lip Sync is installed')
    return true
  } catch {
    console.warn('⚠️ Rhubarb Lip Sync is not installed (optional)')
    console.warn('   Download from: https://github.com/DanielSWolf/rhubarb-lip-sync/releases')
    console.warn('   Set RHUBARB_PATH environment variable if installed in custom location')
    return false
  }
}

function createDirectories() {
  const dirs = [
    'public/video-templates',
    'uploads/ai-influencer',
  ]

  dirs.forEach((dir) => {
    const fullPath = join(process.cwd(), dir)
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true })
      console.log(`✅ Created directory: ${dir}`)
    } else {
      console.log(`ℹ️  Directory exists: ${dir}`)
    }
  })
}

function createTemplateReadme() {
  const readmePath = join(process.cwd(), 'public/video-templates/README.md')
  const readmeContent = `# Video Templates

Place your video templates in this directory.

## Required Templates

Based on the template configuration in \`lib/ai-influencer/video-templates.ts\`, you need:

1. **testimonial-female-indoor.mp4** - Female testimonial style (30s)
2. **testimonial-male-indoor.mp4** - Male testimonial style (30s)
3. **demo-female.mp4** - Product demo style (45s)
4. **problem-solution-female.mp4** - Problem-solution style (40s)

## Template Requirements

- **Format:** MP4 (H.264 codec recommended)
- **Resolution:** 1080p (1920x1080) or 720p (1280x720)
- **Frame Rate:** 30fps
- **Duration:** Match the duration specified in template config
- **Content:** Pre-recorded videos with neutral backgrounds, suitable for face overlay

## Creating Templates

You can:
1. Record videos with actors/models
2. Use stock video footage
3. Create animated templates
4. Use AI-generated video backgrounds

## Production

In production, templates should be stored in:
- PayAid Drive
- S3/Cloud Storage
- CDN

Update \`lib/ai-influencer/video-templates.ts\` to use cloud URLs.
`

  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, readmeContent)
    console.log('✅ Created template README')
  }
}

async function main() {
  console.log('🚀 Setting up AI Influencer Marketing...\n')

  // Create directories
  console.log('📁 Creating directories...')
  createDirectories()
  createTemplateReadme()
  console.log('')

  // Check dependencies
  console.log('🔍 Checking dependencies...\n')
  const ffmpegInstalled = await checkFFmpeg()
  console.log('')
  const rhubarbInstalled = await checkRhubarb()
  console.log('')

  // Summary
  console.log('📋 Setup Summary:')
  console.log(`   FFmpeg: ${ffmpegInstalled ? '✅ Installed' : '❌ Not Installed'}`)
  console.log(`   Rhubarb: ${rhubarbInstalled ? '✅ Installed' : '⚠️  Optional (not installed)'}`)
  console.log('   Directories: ✅ Created')
  console.log('')

  if (!ffmpegInstalled) {
    console.log('⚠️  WARNING: FFmpeg is required for video generation!')
    console.log('   Please install FFmpeg before generating videos.\n')
  }

  console.log('✅ Setup complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Add video templates to public/video-templates/')
  console.log('2. (Optional) Install Rhubarb for lip-sync')
  console.log('3. Configure TTS service in Settings > AI Integrations')
  console.log('4. Initialize queue processor in app startup')
}

main().catch(console.error)

