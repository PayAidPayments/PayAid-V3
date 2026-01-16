/**
 * k6 Load Test Scenarios
 * 
 * Multiple test scenarios for different load levels
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const cacheHitRate = new Rate('cache_hits');
const responseTime = new Trend('response_time');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || '';

// Common headers
const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
};

/**
 * Scenario 1: 1,000 Concurrent Users
 */
export const scenario1k = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100
    { duration: '3m', target: 500 },  // Ramp up to 500
    { duration: '3m', target: 1000 }, // Ramp up to 1000
    { duration: '5m', target: 1000 }, // Stay at 1000
    { duration: '2m', target: 0 },     // Ramp down
  ],
  gracefulRampDown: '30s',
};

/**
 * Scenario 2: 5,000 Concurrent Users
 */
export const scenario5k = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '3m', target: 500 },
    { duration: '5m', target: 2000 },
    { duration: '5m', target: 5000 },
    { duration: '10m', target: 5000 },
    { duration: '3m', target: 0 },
  ],
  gracefulRampDown: '1m',
};

/**
 * Scenario 3: 10,000 Concurrent Users
 */
export const scenario10k = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '5m', target: 1000 },
    { duration: '10m', target: 5000 },
    { duration: '10m', target: 10000 },
    { duration: '15m', target: 10000 },
    { duration: '5m', target: 0 },
  ],
  gracefulRampDown: '2m',
};

// Test thresholds
export const thresholds = {
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  errors: ['rate<0.01'],
  cache_hits: ['rate>0.70'], // Expect 70%+ cache hit rate
};

// Main test function
export default function () {
  // Test endpoints in sequence (simulating user behavior)
  const endpoints = [
    '/api/contacts',
    '/api/deals',
    '/api/tasks',
    '/api/invoices',
    '/api/orders',
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    const res = http.get(`${BASE_URL}${endpoint}`, { headers });
    const duration = Date.now() - start;

    // Check response
    const success = check(res, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 500ms`]: (r) => r.timings.duration < 500,
    });

    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    // Track cache hits (if X-Cache header is present)
    if (res.headers['X-Cache'] === 'HIT') {
      cacheHitRate.add(1);
    } else {
      cacheHitRate.add(0);
    }

    responseTime.add(duration);
    sleep(1);
  }
}
