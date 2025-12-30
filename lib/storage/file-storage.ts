/**
 * File Storage Utility
 * 
 * Supports multiple storage backends:
 * - AWS S3
 * - Cloudflare R2 (S3-compatible)
 * - Local filesystem (development)
 * 
 * Environment variables:
 * - STORAGE_PROVIDER: 's3' | 'r2' | 'local' (default: 'local')
 * - AWS_REGION: AWS region (for S3)
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - S3_BUCKET_NAME: S3 bucket name
 * - R2_ACCOUNT_ID: Cloudflare R2 account ID
 * - R2_ACCESS_KEY_ID: R2 access key
 * - R2_SECRET_ACCESS_KEY: R2 secret key
 * - R2_BUCKET_NAME: R2 bucket name
 * - STORAGE_BASE_URL: Base URL for file access (CDN URL)
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export type StorageProvider = 's3' | 'r2' | 'local'

export interface UploadFileOptions {
  file: File | Buffer
  fileName: string
  folder?: string
  contentType?: string
  makePublic?: boolean
}

export interface UploadResult {
  url: string
  key: string
  size: number
}

/**
 * Get S3-compatible client based on provider
 */
function getS3Client(): S3Client {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

  if (provider === 'r2') {
    // Cloudflare R2 (S3-compatible)
    return new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    })
  } else if (provider === 's3') {
    // AWS S3
    return new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  } else {
    // Local development - return a mock client
    // In production, you should use S3 or R2
    throw new Error('Local storage not implemented. Please configure S3 or R2.')
  }
}

/**
 * Get bucket name based on provider
 */
function getBucketName(): string {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

  if (provider === 'r2') {
    return process.env.R2_BUCKET_NAME || ''
  } else if (provider === 's3') {
    return process.env.S3_BUCKET_NAME || ''
  } else {
    return 'local-storage'
  }
}

/**
 * Generate unique file key
 */
function generateFileKey(fileName: string, folder?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = folder ? `${folder}/${timestamp}-${random}-${sanitizedFileName}` : `${timestamp}-${random}-${sanitizedFileName}`
  return key
}

/**
 * Upload file to storage
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

  // For local development without storage configured, return placeholder
  if (provider === 'local' && !process.env.STORAGE_BASE_URL) {
    console.warn('Storage not configured. Using placeholder URL. Configure S3 or R2 for production.')
    const key = generateFileKey(options.fileName, options.folder)
    return {
      url: `placeholder://${key}`,
      key,
      size: options.file instanceof File ? options.file.size : options.file.length,
    }
  }

  try {
    const client = getS3Client()
    const bucket = getBucketName()
    const key = generateFileKey(options.fileName, options.folder)

    // Convert File to Buffer if needed
    let buffer: Buffer
    if (options.file instanceof File) {
      const arrayBuffer = await options.file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = options.file
    }

    // Upload to S3/R2
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || 'application/octet-stream',
      ...(options.makePublic ? { ACL: 'public-read' } : {}),
    })

    await client.send(command)

    // Generate URL
    const baseUrl = process.env.STORAGE_BASE_URL || ''
    const url = baseUrl ? `${baseUrl}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}`

    return {
      url,
      key,
      size: buffer.length,
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get file URL (signed URL for private files)
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

  if (provider === 'local') {
    const baseUrl = process.env.STORAGE_BASE_URL || ''
    return baseUrl ? `${baseUrl}/${key}` : `placeholder://${key}`
  }

  try {
    const client = getS3Client()
    const bucket = getBucketName()

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    // Generate signed URL
    const url = await getSignedUrl(client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('Get file URL error:', error)
    throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider

  if (provider === 'local') {
    console.warn('Local storage delete not implemented')
    return
  }

  try {
    const client = getS3Client()
    const bucket = getBucketName()

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    await client.send(command)
  } catch (error) {
    console.error('Delete file error:', error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract key from URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // For S3 URLs: https://bucket.s3.region.amazonaws.com/key
    // For R2 URLs: https://account.r2.cloudflarestorage.com/bucket/key
    // For custom CDN: https://cdn.example.com/key
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.startsWith('/') ? pathname.substring(1) : pathname
  } catch {
    // For placeholder URLs: placeholder://key
    if (url.startsWith('placeholder://')) {
      return url.replace('placeholder://', '')
    }
    return null
  }
}

