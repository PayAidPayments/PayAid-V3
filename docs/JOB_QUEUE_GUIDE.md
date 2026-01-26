# Job Queue Integration Guide

## Overview

The job queue system uses Bull.js with Redis for background processing of model training and deployment tasks.

## Architecture

- **Queue System:** Bull.js
- **Backend:** Redis (local or Upstash)
- **Jobs:** Model training and deployment
- **Processors:** Background workers

## Setup

### 1. Redis Configuration

**Local Redis:**
```bash
# Install Redis
# macOS: brew install redis
# Linux: apt-get install redis-server
# Windows: Use WSL or Docker

# Start Redis
redis-server
```

**Upstash Redis (Cloud):**
```bash
# Get Redis URL from Upstash dashboard
export REDIS_URL="redis://default:password@host:port"
```

### 2. Environment Variables

```env
REDIS_URL=redis://localhost:6379
# Or for Upstash:
# REDIS_URL=redis://default:password@host:port
```

### 3. Queue Processors

Processors auto-start when imported. Ensure they're loaded:

```typescript
// In your app initialization
import '@/lib/queue/model-training-queue'
```

---

## Usage

### Training Job

**API Endpoint:** `POST /api/ai/models/[companyId]/train`

**Request:**
```json
{
  "epochs": 3,
  "batchSize": 4,
  "learningRate": 0.0002
}
```

**Response:**
```json
{
  "success": true,
  "message": "Training job queued successfully",
  "jobId": "123",
  "status": "queued",
  "datasetSize": 500,
  "qualityScore": 0.85
}
```

**Job Processing:**
1. Export training data
2. Run Python training script
3. Save model weights
4. Return model path

---

### Deployment Job

**API Endpoint:** `POST /api/ai/models/[companyId]/deploy`

**Request:**
```json
{
  "modelPath": "./models/tenant-123",
  "version": "1.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deployment job queued successfully",
  "jobId": "456",
  "status": "queued",
  "modelName": "mistral-7b-company-tenant-123:1.0"
}
```

**Job Processing:**
1. Convert to GGUF (if needed)
2. Deploy to Ollama
3. Verify deployment
4. Return model name

---

## Job Status

### Check Job Status

```typescript
import { getTrainingQueue } from '@/lib/queue/model-training-queue'

const queue = getTrainingQueue()
const job = await queue.getJob(jobId)

console.log('State:', await job.getState())
console.log('Progress:', await job.progress())
console.log('Result:', await job.finished())
```

### Job States

- `waiting` - Queued, waiting to be processed
- `active` - Currently being processed
- `completed` - Successfully completed
- `failed` - Failed with error
- `delayed` - Scheduled for later
- `paused` - Temporarily paused

---

## Monitoring

### Bull Board (Dashboard)

Install Bull Board for visual monitoring:

```bash
npm install @bull-board/api @bull-board/express
```

```typescript
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullAdapter(getTrainingQueue()),
    new BullAdapter(getDeploymentQueue()),
  ],
  serverAdapter,
})

app.use('/admin/queues', serverAdapter.getRouter())
```

### Redis CLI

```bash
# Connect to Redis
redis-cli

# Check queue length
LLEN bull:model-training:waiting
LLEN bull:model-training:active
LLEN bull:model-training:completed
LLEN bull:model-training:failed

# List jobs
LRANGE bull:model-training:waiting 0 -1
```

---

## Error Handling

### Automatic Retries

Jobs automatically retry on failure:

```typescript
{
  attempts: 2,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds
  }
}
```

### Manual Retry

```typescript
const job = await queue.getJob(jobId)
await job.retry()
```

### Job Cleanup

```typescript
// Remove completed jobs (keep last 100)
queue.clean(1000, 100, 'completed')

// Remove failed jobs (keep last 50)
queue.clean(1000, 50, 'failed')
```

---

## Fallback Behavior

If Redis is unavailable, the API falls back to manual instructions:

```json
{
  "success": true,
  "message": "Training data prepared. Run fine-tuning service manually:",
  "instructions": {
    "command": "cd services/fine-tuning && python train.py ...",
    "dataPath": "./data/tenant-123-training.jsonl"
  },
  "note": "Job queue unavailable. Use manual command above."
}
```

---

## Testing

### Test Script

Run the test script:

```bash
npx tsx scripts/test-job-queue.ts
```

### Manual Testing

1. **Start Redis:**
   ```bash
   redis-server
   ```

2. **Trigger Training:**
   ```bash
   curl -X POST http://localhost:3000/api/ai/models/test-tenant/train \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"epochs": 1, "batchSize": 2}'
   ```

3. **Check Job Status:**
   ```bash
   redis-cli
   > LLEN bull:model-training:waiting
   ```

---

## Production Considerations

### Queue Workers

Run dedicated workers for job processing:

```typescript
// worker.ts
import { setupModelTrainingProcessors } from './lib/queue/model-training-queue'

setupModelTrainingProcessors()

console.log('Job queue workers started')
```

### Scaling

- **Multiple Workers:** Run multiple worker processes
- **Queue Priorities:** Use priority queues for urgent jobs
- **Rate Limiting:** Limit concurrent jobs per tenant
- **Resource Limits:** Set memory/CPU limits per job

### Monitoring

- **Job Success Rate:** Track completion vs failure
- **Processing Time:** Monitor average job duration
- **Queue Length:** Alert if queue grows too large
- **Error Rates:** Track and alert on failures

---

## Troubleshooting

### Jobs Not Processing

1. Check Redis connection
2. Verify workers are running
3. Check job processor logs
4. Verify Python scripts are accessible

### Jobs Failing

1. Check job error logs
2. Verify training data exists
3. Check Python dependencies
4. Verify model paths are correct

### Redis Connection Issues

1. Verify REDIS_URL is set
2. Check Redis is running
3. Test connection: `redis-cli ping`
4. Check firewall/network settings

---

## Best Practices

1. **Job Timeouts:** Set reasonable timeouts
2. **Resource Limits:** Limit concurrent jobs
3. **Error Handling:** Log all errors
4. **Monitoring:** Set up alerts
5. **Cleanup:** Regularly clean old jobs
6. **Retries:** Use exponential backoff
7. **Idempotency:** Ensure jobs can be safely retried

---

## Next Steps

1. Set up Redis (local or Upstash)
2. Test job queue with test script
3. Monitor jobs in Bull Board
4. Integrate into production workflow
5. Set up monitoring and alerts
