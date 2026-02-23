/**
 * File storage integration – S3 or Cloudinary
 * Configure via env: FILE_STORAGE_PROVIDER=s3|cloudinary
 * S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
 * Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

export type FileStorageProvider = 's3' | 'cloudinary' | 'local'

export interface UploadResult {
  url: string
  key?: string
  publicId?: string
  size: number
  mimeType: string
}

const PROVIDER = (process.env.FILE_STORAGE_PROVIDER || 'local') as FileStorageProvider

/**
 * Upload a file buffer to configured storage; returns public URL.
 */
export async function uploadFile(params: {
  buffer: Buffer
  fileName: string
  mimeType: string
  folder?: string
  tenantId?: string
}): Promise<UploadResult> {
  const { buffer, fileName, mimeType, folder = 'hr', tenantId } = params
  const prefix = tenantId ? `${folder}/${tenantId}` : folder
  const key = `${prefix}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  if (PROVIDER === 'cloudinary') {
    return uploadToCloudinary(buffer, key, mimeType)
  }

  if (PROVIDER === 's3') {
    return uploadToS3(buffer, key, mimeType)
  }

  // local: return path that can be served by Next.js public or API route
  const url = `/api/uploads/${key}`
  return { url, key, size: buffer.length, mimeType }
}

async function uploadToCloudinary(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return fallbackLocal(buffer, key, mimeType)
  }
  const crypto = await import('crypto')
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = crypto
    .createHash('sha1')
    .update(`folder=hr&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')
  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: mimeType }), key.split('/').pop())
  formData.append('folder', 'hr')
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('api_key', apiKey)
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw'
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) return fallbackLocal(buffer, key, mimeType)
  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    size: buffer.length,
    mimeType,
  }
}

async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  const region = process.env.AWS_REGION
  const bucket = process.env.S3_BUCKET
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return fallbackLocal(buffer, key, mimeType)
  }
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    )
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    return { url, key, size: buffer.length, mimeType }
  } catch {
    return fallbackLocal(buffer, key, mimeType)
  }
}

function fallbackLocal(buffer: Buffer, key: string, mimeType: string): UploadResult {
  return {
    url: `/api/uploads/${key}`,
    key,
    size: buffer.length,
    mimeType,
  }
}
