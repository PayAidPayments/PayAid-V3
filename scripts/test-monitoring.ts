/**
 * Test Monitoring & Metrics
 * 
 * Tests the monitoring system to ensure metrics are being tracked correctly
 */

import { trackAPICall, getEndpointMetrics, getAllMetrics } from '@/lib/monitoring/metrics'
import { trackAPICall as trackStatsD, trackCacheHit, trackCacheMiss, trackDatabaseQuery } from '@/lib/monitoring/statsd'

async function testMonitoring() {
  console.log('🧪 Testing Monitoring & Metrics...\n')

  try {
    // Test 1: Track API calls
    console.log('📊 Test 1: Tracking API calls...')
    trackAPICall('/api/contacts', 150, 200)
    trackAPICall('/api/contacts', 200, 200)
    trackAPICall('/api/deals', 300, 200)
    trackAPICall('/api/tasks', 500, 200)
    trackAPICall('/api/invoices', 100, 200)
    trackAPICall('/api/orders', 250, 200)
    trackAPICall('/api/contacts', 1200, 500) // Slow request
    trackAPICall('/api/deals', 100, 404) // Error
    console.log('   ✅ API calls tracked')

    // Test 2: Track cache metrics
    console.log('💾 Test 2: Tracking cache metrics...')
    trackCacheHit('/api/contacts', 'L1')
    trackCacheHit('/api/contacts', 'L2')
    trackCacheMiss('/api/deals')
    trackCacheHit('/api/tasks', 'L1')
    trackCacheMiss('/api/invoices')
    console.log('   ✅ Cache metrics tracked')

    // Test 3: Track database queries
    console.log('🗄️  Test 3: Tracking database queries...')
    trackDatabaseQuery('findMany', 50, true)
    trackDatabaseQuery('findUnique', 30, true)
    trackDatabaseQuery('create', 100, true)
    trackDatabaseQuery('update', 80, true)
    trackDatabaseQuery('findMany', 2000, false) // Slow query
    console.log('   ✅ Database metrics tracked')

    // Test 4: Get endpoint metrics
    console.log('📈 Test 4: Retrieving endpoint metrics...')
    const contactsMetrics = getEndpointMetrics('/api/contacts')
    console.log(`   /api/contacts:`)
    console.log(`   - Count: ${contactsMetrics.count}`)
    console.log(`   - Avg Duration: ${contactsMetrics.avgDuration.toFixed(2)}ms`)
    console.log(`   - P95: ${contactsMetrics.p95}ms`)
    console.log(`   - Error Rate: ${(contactsMetrics.errorRate * 100).toFixed(2)}%`)

    // Test 5: Get all metrics summary
    console.log('📊 Test 5: Retrieving all metrics summary...')
    const allMetrics = getAllMetrics()
    console.log(`   Total Requests: ${allMetrics.totalRequests}`)
    console.log(`   Avg Response Time: ${allMetrics.avgResponseTime.toFixed(2)}ms`)
    console.log(`   Error Rate: ${(allMetrics.errorRate * 100).toFixed(2)}%`)
    console.log(`   Top Endpoints:`)
    allMetrics.topEndpoints.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ${endpoint.endpoint}: ${endpoint.count} requests`)
    })

    console.log('\n✅ Monitoring test complete!')
    console.log('\n💡 Note:')
    console.log('   - Metrics are stored in-memory (for development)')
    console.log('   - In production, set STATSD_HOST to send metrics to StatsD')
    console.log('   - StatsD metrics are sent automatically if configured')

  } catch (error: any) {
    console.error('❌ Monitoring test failed:', error.message)
    process.exit(1)
  }
}

testMonitoring()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
