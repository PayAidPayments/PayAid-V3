import { sleep } from 'k6';
import { get, post, TENANT_ID } from './_common.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '90s', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  get(`/api/crm/dashboard/summary?tenantId=${TENANT_ID}`, 4000, 'platform-crm');
  get(`/api/marketing/dashboard/enriched?tenantId=${TENANT_ID}`, 5000, 'platform-marketing');
  get(`/api/invoices?tenantId=${TENANT_ID}`, 4000, 'platform-finance');
  post(
    '/api/ai/text/generate',
    { prompt: 'Generate a campaign headline', tenantId: TENANT_ID },
    10000,
    'platform-ai-text'
  );
  sleep(1);
}
