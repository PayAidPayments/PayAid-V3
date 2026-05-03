import Docker from 'dockerode'
import axios from 'axios'
import * as crypto from 'crypto'

// Configuration
const WAHA_IMAGE = 'devlikeapro/whatsapp-http-api:latest'
const WAHA_PORT_START = 3500 // Start allocating ports from 3500
const CONTAINER_MEMORY = 512 * 1024 * 1024 // 512MB per container
const INTERNAL_BASE_URL = process.env.INTERNAL_WAHA_BASE_URL || 'http://127.0.0.1'

// Initialize Docker client
let docker: Docker | null = null

function getDockerClient(): Docker {
  if (!docker) {
    docker = new Docker()
  }
  return docker
}

// In-memory port allocation (in production, use Redis)
const allocatedPorts = new Set<number>()

export function allocatePort(): number {
  let port = WAHA_PORT_START
  while (allocatedPorts.has(port)) {
    port++
  }
  if (port > WAHA_PORT_START + 100) {
    throw new Error('No available ports for WAHA container')
  }
  allocatedPorts.add(port)
  return port
}

export function deallocatePort(port: number): void {
  allocatedPorts.delete(port)
}

export function generateSecureKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Deploy WAHA container with Docker
 */
export async function deployWahaContainer(
  instanceId: string,
  apiKey: string,
  port: number
): Promise<{ containerId: string; containerName: string }> {
  try {
    const dockerClient = getDockerClient()

    // Check if image exists, if not pull it
    const images = await dockerClient.listImages({ filters: { reference: [WAHA_IMAGE] } })
    if (images.length === 0) {
      console.log(`[DOCKER] Pulling image ${WAHA_IMAGE}...`)
      const stream = await dockerClient.pull(WAHA_IMAGE)
      await new Promise<void>((resolve, reject) => {
        dockerClient.modem.followProgress(stream, (err, res) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }

    // Create container
    const container = await dockerClient.createContainer({
      Image: WAHA_IMAGE,
      name: instanceId,
      Hostname: instanceId,
      Env: [
        `INSTANCE_NAME=${instanceId}`,
        `API_KEY=${apiKey}`,
        `LOG_LEVEL=info`,
      ],
      ExposedPorts: {
        '3000/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [
            {
              HostIp: '127.0.0.1',
              HostPort: String(port),
            },
          ],
        },
        Memory: CONTAINER_MEMORY,
        MemorySwap: CONTAINER_MEMORY,
        RestartPolicy: {
          Name: 'on-failure',
          MaximumRetryCount: 3,
        },
      },
    })

    // Start container
    await container.start()
    console.log(`[DOCKER] Container started: ${container.id}`)

    return {
      containerId: container.id,
      containerName: instanceId,
    }
  } catch (error) {
    console.error(`[DOCKER] Container creation failed:`, error)
    throw error
  }
}

/**
 * Wait for WAHA container to be ready and get QR code
 */
export async function waitAndGetQrCode(
  wahaUrl: string,
  apiKey: string,
  instanceId: string,
  timeoutMs: number = 60000 // Increased to 60 seconds
): Promise<{ qr: string; qrText: string }> {
  const startTime = Date.now()
  const pollInterval = 2000 // 2 seconds between retries
  let lastError: any = null

  console.log(`[WAHA] Waiting for container to be ready: ${wahaUrl}`)

  // First, wait for container to be healthy (check if API is responding)
  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check if WAHA API is responding
      const healthCheck = await axios.get(`${wahaUrl}/api/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      })

      if (healthCheck.status === 200 || healthCheck.status === 401) {
        // API is responding (401 means auth needed, which is fine)
        console.log(`[WAHA] Container is responding, creating instance...`)
        break
      }
    } catch (error) {
      lastError = error
      const elapsed = Date.now() - startTime
      if (elapsed % 10000 < pollInterval) {
        // Log every 10 seconds
        console.log(`[WAHA] Waiting for container... (${Math.round(elapsed / 1000)}s)`)
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      continue
    }
  }

  if (Date.now() - startTime >= timeoutMs) {
    throw new Error(`Container health check timeout: ${lastError?.message || 'Container not responding'}`)
  }

  // Now create the instance/session
  let sessionName = instanceId
  try {
    console.log(`[WAHA] Creating instance: ${sessionName}`)
    const createResponse = await axios.post(
      `${wahaUrl}/api/instances`,
      { name: sessionName },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      }
    )

    if (createResponse.status === 201 || createResponse.status === 200) {
      console.log(`[WAHA] Instance created successfully`)
    } else if (createResponse.status === 409) {
      // Instance already exists, that's okay
      console.log(`[WAHA] Instance already exists, continuing...`)
    } else {
      console.warn(`[WAHA] Unexpected status creating instance: ${createResponse.status}`, createResponse.data)
    }
  } catch (error: any) {
    // If instance creation fails, try to continue anyway (might already exist)
    console.warn(`[WAHA] Instance creation warning:`, error.message)
  }

  // Now get QR code with retries
  const qrStartTime = Date.now()
  const qrTimeout = 30000 // 30 seconds to get QR after instance is ready

  while (Date.now() - qrStartTime < qrTimeout) {
    try {
      // Try multiple QR endpoint formats
      const endpoints = [
        `${wahaUrl}/api/instances/${sessionName}/qr`,
        `${wahaUrl}/api/${sessionName}/auth/qr`,
        `${wahaUrl}/api/instances/${sessionName}/auth/qr`,
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 5000,
            validateStatus: () => true,
          })

          if (response.status === 200 && response.data) {
            const qrData = response.data.qr || response.data.qrcode || response.data
            if (qrData) {
              console.log(`[WAHA] QR code obtained from ${endpoint}`)
              return {
                qr: typeof qrData === 'string' ? qrData : (qrData.image || qrData.data || ''),
                qrText: response.data.qrText || response.data.text || 'Scan to connect',
              }
            }
          }
        } catch (endpointError) {
          // Try next endpoint
          continue
        }
      }
    } catch (error: any) {
      lastError = error
      // Continue retrying
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error(`QR code retrieval timeout: ${lastError?.message || 'Could not get QR code from any endpoint'}`)
}

/**
 * Configure WAHA webhooks
 */
export async function configureWahaWebhooks(
  wahaUrl: string,
  apiKey: string,
  instanceId: string
): Promise<void> {
  const webhookUrl = `${process.env.PAYAID_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhooks/message`

  try {
    await axios.post(
      `${wahaUrl}/api/instances/${instanceId}/webhooks`,
      {
        url: webhookUrl,
        events: ['message:received', 'message:ack', 'message:reaction'],
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      }
    )
  } catch (error) {
    console.error(`[WHATSAPP] Webhook config failed:`, error)
    throw error
  }
}

/**
 * Clean up container on failure
 */
export async function cleanupContainer(
  containerId: string,
  port: number
): Promise<void> {
  try {
    const dockerClient = getDockerClient()
    const container = dockerClient.getContainer(containerId)
    await container.stop()
    await container.remove()
    deallocatePort(port)
    console.log(`[DOCKER] Cleaned up container: ${containerId}`)
  } catch (error) {
    console.error(`[DOCKER] Cleanup failed:`, error)
  }
}
