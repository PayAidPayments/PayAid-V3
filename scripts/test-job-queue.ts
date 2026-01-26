/**
 * Test Script for Model Training/Deployment Job Queue
 * Tests the Bull.js job queue integration
 */

import { getTrainingQueue, getDeploymentQueue } from '../lib/queue/model-training-queue'

async function testJobQueue() {
  console.log('🧪 Testing Job Queue Integration...\n')

  // Test Training Queue
  console.log('1. Testing Training Queue...')
  try {
    const trainingQueue = getTrainingQueue()
    
    // Add a test job
    const trainingJob = await trainingQueue.add('train-model', {
      tenantId: 'test-tenant-123',
      epochs: 1,
      batchSize: 2,
      learningRate: 2e-4,
    }, {
      attempts: 1,
    })

    console.log(`✅ Training job added: ${trainingJob.id}`)
    console.log(`   Job data:`, trainingJob.data)
    
    // Get job status
    const jobState = await trainingJob.getState()
    console.log(`   Job state: ${jobState}`)
    
    // Wait a bit and check progress
    await new Promise(resolve => setTimeout(resolve, 2000))
    const progress = await trainingJob.progress()
    console.log(`   Job progress: ${progress}%`)
    
  } catch (error) {
    console.error('❌ Training queue test failed:', error)
  }

  console.log('\n2. Testing Deployment Queue...')
  try {
    const deploymentQueue = getDeploymentQueue()
    
    // Add a test job
    const deploymentJob = await deploymentQueue.add('deploy-model', {
      tenantId: 'test-tenant-123',
      modelPath: './models/test-model',
      modelName: 'test-model-v1',
    }, {
      attempts: 1,
    })

    console.log(`✅ Deployment job added: ${deploymentJob.id}`)
    console.log(`   Job data:`, deploymentJob.data)
    
    // Get job status
    const jobState = await deploymentJob.getState()
    console.log(`   Job state: ${jobState}`)
    
  } catch (error) {
    console.error('❌ Deployment queue test failed:', error)
  }

  console.log('\n3. Checking Queue Health...')
  try {
    const trainingQueue = getTrainingQueue()
    const deploymentQueue = getDeploymentQueue()
    
    const [trainingCount, deploymentCount] = await Promise.all([
      trainingQueue.getJobCounts(),
      deploymentQueue.getJobCounts(),
    ])
    
    console.log('Training Queue:', {
      waiting: trainingCount.waiting,
      active: trainingCount.active,
      completed: trainingCount.completed,
      failed: trainingCount.failed,
    })
    
    console.log('Deployment Queue:', {
      waiting: deploymentCount.waiting,
      active: deploymentCount.active,
      completed: deploymentCount.completed,
      failed: deploymentCount.failed,
    })
    
    console.log('\n✅ Queue health check complete')
  } catch (error) {
    console.error('❌ Queue health check failed:', error)
    console.log('\n⚠️  Note: Redis may not be running. Queue will fallback to manual instructions.')
  }

  console.log('\n✅ Job Queue Test Complete!')
  console.log('\n📝 Next Steps:')
  console.log('   1. Ensure Redis is running (or use Upstash Redis)')
  console.log('   2. Check REDIS_URL environment variable')
  console.log('   3. Monitor jobs in Bull Board or Redis CLI')
  console.log('   4. Test via API: POST /api/ai/models/[companyId]/train')
}

// Run test
testJobQueue()
  .then(() => {
    console.log('\n✨ All tests completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error)
    process.exit(1)
  })
