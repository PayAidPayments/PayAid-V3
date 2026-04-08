import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.PERF_BASE_URL || 'http://127.0.0.1:3000';
export const API_TOKEN = __ENV.PERF_API_TOKEN || '';
export const TENANT_ID = __ENV.PERF_TENANT_ID || 'demo';

export function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  return headers;
}

export function get(path, thresholdMs, label) {
  const res = http.get(`${BASE_URL}${path}`, { headers: authHeaders() });
  check(res, {
    [`${label} status 2xx/3xx`]: (r) => r.status >= 200 && r.status < 400,
    [`${label} under ${thresholdMs}ms`]: (r) => r.timings.duration < thresholdMs,
  });
  return res;
}

export function post(path, payload, thresholdMs, label) {
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(payload), { headers: authHeaders() });
  check(res, {
    [`${label} status 2xx/3xx`]: (r) => r.status >= 200 && r.status < 400,
    [`${label} under ${thresholdMs}ms`]: (r) => r.timings.duration < thresholdMs,
  });
  return res;
}
