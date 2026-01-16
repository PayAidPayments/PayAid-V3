/**
 * Test Background Job Queue
 * 
 * Tests the job queue system to ensure it's working correctly
 */

import { mediumPriorityQueue, lowPriorityQueue } from '@/lib/queue/bull'

async function testJobQueue() {
  console.log('🧪 Testing Background Job Queue...\n')

  try {
    // Test 1: Add a test email job
    console.log('📧 Test 1: Adding email job...')
    const emailJob = await mediumPriorityQueue.add('send-email', {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1>',
      text: 'Test',
    })
    console.log(`   ✅ Email job added: ${emailJob.id}`)

    // Test 2: Add a cache warming job
    console.log('🔥 Test 2: Adding cache warming job...')
    const cacheJob = await lowPriorityQueue.add('warm-cache', {
      tenantId: 'test-tenant',
    })
    console.log(`   ✅ Cache warming job added: ${cacheJob.id}`)

    // Test 3: Check queue status
    console.log('📊 Test 3: Checking queue status...')
    const [emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
      mediumPriorityQueue.getWaitingCount(),
      mediumPriorityQueue.getActiveCount(),
      mediumPriorityQueue.getCompletedCount(),
      mediumPriorityQueue.getFailedCount(),
    ])
    
    console.log(`   Medium Priority Queue:`)
    console.log(`   - Waiting: ${emailWaiting}`)
    console.log(`   - Active: ${emailActive}`)
    console.log(`   - Completed: ${emailCompleted}`)
    console.log(`   - Failed: ${emailFailed}`)

    const [cacheWaiting, cacheActive, cacheCompleted, cacheFailed] = await Promise.all([
      lowPriorityQueue.getWaitingCount(),
      lowPriorityQueue.getActiveCount(),
      lowPriorityQueue.getCompletedCount(),
      lowPriorityQueue.getFailedCount(),
    ])
    
    console.log(`   Low Priority Queue:`)
    console.log(`   - Waiting: ${cacheWaiting}`)
    console.log(`   - Active: ${cacheActive}`)
    console.log(`   - Completed: ${cacheCompleted}`)
    console.log(`   - Failed: ${cacheFailed}`)

    console.log('\n✅ Job queue test complete!')
    console.log('\n💡 Note: Jobs will be processed by job processors if they are initialized.')
    console.log('   Make sure to call initializeJobProcessors() in your app startup.')

  } catch (error: any) {
    console.error('❌ Job queue test failed:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check REDIS_URL is set correctly')
    console.error('   2. Ensure Redis is running and accessible')
    console.error('   3. Verify Redis connection in lib/redis/client.ts')
    process.exit(1)
  } finally {
    // Clean up - close queues
    await mediumPriorityQueue.close()
    await lowPriorityQueue.close()
  }
}

testJobQueue()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
