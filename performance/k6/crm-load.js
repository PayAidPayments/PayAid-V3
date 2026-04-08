import { sleep } from 'k6';
import { get, TENANT_ID } from './_common.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 40 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  get(`/api/crm/dashboard/summary?tenantId=${TENANT_ID}`, 3000, 'crm-summary');
  get(`/api/deals?tenantId=${TENANT_ID}`, 3000, 'crm-deals');
  sleep(1);
}
