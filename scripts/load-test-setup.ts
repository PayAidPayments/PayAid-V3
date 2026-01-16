/**
 * Load Testing Setup Script
 * 
 * This script helps set up load testing scenarios for the platform.
 * Use with k6, Artillery, or Locust for actual load testing.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Generate k6 load test script
 */
function generateK6Script() {
  const k6Script = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                  // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || '';

export default function () {
  // Test 1: GET /api/contacts
  const contactsRes = http.get(\`\${BASE_URL}/api/contacts\`, {
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json',
    },
  });
  check(contactsRes, {
    'contacts status is 200': (r) => r.status === 200,
    'contacts response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: GET /api/deals
  const dealsRes = http.get(\`\${BASE_URL}/api/deals\`, {
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json',
    },
  });
  check(dealsRes, {
    'deals status is 200': (r) => r.status === 200,
    'deals response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: GET /api/tasks
  const tasksRes = http.get(\`\${BASE_URL}/api/tasks\`, {
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json',
    },
  });
  check(tasksRes, {
    'tasks status is 200': (r) => r.status === 200,
    'tasks response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}
`

  const outputPath = join(process.cwd(), 'load-tests', 'k6-load-test.js')
  writeFileSync(outputPath, k6Script)
  console.log(`✅ Generated k6 load test script: ${outputPath}`)
}

/**
 * Generate Artillery load test config
 */
function generateArtilleryConfig() {
  const artilleryConfig = {
    config: {
      target: process.env.BASE_URL || 'http://localhost:3000',
      phases: [
        { duration: 120, arrivalRate: 1, name: 'Warm up' },
        { duration: 300, arrivalRate: 10, name: 'Ramp up to 10 users/sec' },
        { duration: 300, arrivalRate: 50, name: 'Ramp up to 50 users/sec' },
        { duration: 300, arrivalRate: 100, name: 'Ramp up to 100 users/sec' },
        { duration: 300, arrivalRate: 100, name: 'Sustained load' },
      ],
      defaults: {
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN || ''}`,
          'Content-Type': 'application/json',
        },
      },
    },
    scenarios: [
      {
        name: 'API Load Test',
        flow: [
          { get: { url: '/api/contacts' } },
          { think: 1 },
          { get: { url: '/api/deals' } },
          { think: 1 },
          { get: { url: '/api/tasks' } },
          { think: 1 },
          { get: { url: '/api/invoices' } },
          { think: 1 },
          { get: { url: '/api/orders' } },
        ],
      },
    ],
  }

  const outputPath = join(process.cwd(), 'load-tests', 'artillery-config.yml')
  writeFileSync(outputPath, JSON.stringify(artilleryConfig, null, 2))
  console.log(`✅ Generated Artillery config: ${outputPath}`)
}

/**
 * Generate load test instructions
 */
function generateInstructions() {
  const instructions = `# Load Testing Instructions

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/
   Or install Artillery: npm install -g artillery

2. Set environment variables:
   \`\`\`bash
   export BASE_URL="https://your-domain.com"
   export API_TOKEN="your-jwt-token"
   \`\`\`

## Running k6 Load Test

\`\`\`bash
cd load-tests
k6 run k6-load-test.js
\`\`\`

## Running Artillery Load Test

\`\`\`bash
cd load-tests
artillery run artillery-config.yml
\`\`\`

## Test Scenarios

### Scenario 1: 1,000 Concurrent Users
- Duration: 10 minutes
- Ramp up: 2 minutes
- Sustained: 5 minutes
- Ramp down: 2 minutes

### Scenario 2: 5,000 Concurrent Users
- Duration: 20 minutes
- Ramp up: 5 minutes
- Sustained: 10 minutes
- Ramp down: 5 minutes

### Scenario 3: 10,000 Concurrent Users
- Duration: 30 minutes
- Ramp up: 10 minutes
- Sustained: 15 minutes
- Ramp down: 5 minutes

## Metrics to Monitor

1. **Response Times:**
   - p50 (median)
   - p95 (95th percentile)
   - p99 (99th percentile)

2. **Error Rates:**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Total error rate

3. **Throughput:**
   - Requests per second
   - Successful requests per second

4. **System Metrics:**
   - Database connection pool usage
   - Redis connection status
   - Cache hit rate
   - CPU usage
   - Memory usage

## Success Criteria

- ✅ p95 response time < 500ms
- ✅ p99 response time < 1000ms
- ✅ Error rate < 0.1%
- ✅ Cache hit rate > 70%
- ✅ No database connection exhaustion
- ✅ No Redis connection issues
`

  const outputPath = join(process.cwd(), 'load-tests', 'README.md')
  writeFileSync(outputPath, instructions)
  console.log(`✅ Generated load test instructions: ${outputPath}`)
}

async function setupLoadTesting() {
  console.log('📊 Setting up Load Testing...\n')

  try {
    // Create load-tests directory
    const loadTestsDir = join(process.cwd(), 'load-tests')
    if (!require('fs').existsSync(loadTestsDir)) {
      require('fs').mkdirSync(loadTestsDir, { recursive: true })
    }

    // Generate test files
    generateK6Script()
    generateArtilleryConfig()
    generateInstructions()

    console.log('\n✅ Load testing setup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Install k6 or Artillery')
    console.log('   2. Set BASE_URL and API_TOKEN environment variables')
    console.log('   3. Run load tests from the load-tests directory')
    console.log('   4. Monitor metrics during testing')
    console.log('   5. Analyze results and optimize')

  } catch (error: any) {
    console.error('❌ Failed to set up load testing:', error.message)
    process.exit(1)
  }
}

setupLoadTesting()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
