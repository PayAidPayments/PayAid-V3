import { sleep } from 'k6';
import { get, post, TENANT_ID } from './_common.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 40 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  get(`/api/marketing/dashboard/enriched?tenantId=${TENANT_ID}`, 4000, 'marketing-dashboard');
  post(
    '/api/ai/text/generate',
    { prompt: 'Create short festive campaign copy', tenantId: TENANT_ID },
    10000,
    'marketing-ai-text'
  );
  sleep(1);
}
