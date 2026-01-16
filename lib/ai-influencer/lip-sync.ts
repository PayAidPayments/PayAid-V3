/**
 * Lip-Sync Service
 * Uses Rhubarb Lip Sync for generating mouth shapes from audio
 * 
 * Rhubarb is a command-line tool that generates mouth shapes
 * Download from: https://github.com/DanielSWolf/rhubarb-lip-sync
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { existsSync, writeFileSync, readFileSync } from 'fs'

const execAsync = promisify(exec)

export interface LipSyncData {
  time: number // seconds
  shape: string // A, B, C, D, E, F, G, H, X (mouth shapes)
}

export interface LipSyncResult {
  data: LipSyncData[]
  duration: number
}

/**
 * Generate lip-sync data from audio file using Rhubarb
 * 
 * @param audioPath Path to audio file (WAV format preferred)
 * @param outputPath Path to save JSON output
 * @returns Lip sync data
 */
export async function generateLipSync(
  audioPath: string,
  outputPath?: string
): Promise<LipSyncResult> {
  try {
    if (!existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`)
    }

    // Check if Rhubarb is available
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb'
    
    // Generate lip-sync data
    // Rhubarb command: rhubarb audio.wav -f json -o output.json
    const jsonOutput = outputPath || audioPath.replace(/\.(wav|mp3)$/, '.json')
    
    try {
      const { stdout, stderr } = await execAsync(
        `"${rhubarbPath}" "${audioPath}" -f json -o "${jsonOutput}"`
      )
      
      if (stderr && !stderr.includes('Warning')) {
        console.warn('Rhubarb warnings:', stderr)
      }
    } catch (error: any) {
      // If Rhubarb is not installed, generate placeholder data
      if (error.code === 'ENOENT' || error.message.includes('not found')) {
        console.warn('Rhubarb not found, generating placeholder lip-sync data')
        return generatePlaceholderLipSync(audioPath, jsonOutput)
      }
      throw error
    }

    // Read generated JSON
    if (!existsSync(jsonOutput)) {
      throw new Error(`Lip-sync output file not created: ${jsonOutput}`)
    }

    const jsonData = JSON.parse(readFileSync(jsonOutput, 'utf-8'))
    
    // Convert Rhubarb format to our format
    const data: LipSyncData[] = jsonData.metadata?.mouthCues?.map((cue: any) => ({
      time: cue.start,
      shape: cue.value || 'X',
    })) || []

    // If no data, generate placeholder
    if (data.length === 0) {
      return generatePlaceholderLipSync(audioPath, jsonOutput)
    }

    return {
      data,
      duration: Math.max(...data.map((d) => d.time)) + 0.1,
    }
  } catch (error) {
    console.error('Lip-sync generation error:', error)
    // Return placeholder on error
    return generatePlaceholderLipSync(audioPath)
  }
}

/**
 * Generate placeholder lip-sync data when Rhubarb is not available
 */
function generatePlaceholderLipSync(
  audioPath: string,
  outputPath?: string
): LipSyncResult {
  // Estimate duration (placeholder - in production, use audio metadata)
  const estimatedDuration = 30 // seconds
  
  // Generate placeholder mouth shapes
  const data: LipSyncData[] = []
  const shapes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  
  for (let i = 0; i < estimatedDuration * 10; i++) {
    data.push({
      time: i * 0.1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    })
  }

  const result: LipSyncResult = {
    data,
    duration: estimatedDuration,
  }

  // Save placeholder data if output path provided
  if (outputPath) {
    const jsonData = {
      metadata: {
        soundFile: audioPath,
        duration: estimatedDuration,
        mouthCues: data.map((d) => ({
          start: d.time,
          end: d.time + 0.1,
          value: d.shape,
        })),
      },
    }
    writeFileSync(outputPath, JSON.stringify(jsonData, null, 2))
  }

  return result
}

/**
 * Check if Rhubarb is installed
 */
export async function checkRhubarbInstalled(): Promise<boolean> {
  try {
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb'
    await execAsync(`"${rhubarbPath}" --version`)
    return true
  } catch {
    return false
  }
}

