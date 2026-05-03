import { sleep } from 'k6';
import { get, TENANT_ID } from './_common.js';

export const options = {
  stages: [
    { duration: '20s', target: 8 },
    { duration: '1m', target: 30 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  get(`/api/invoices?tenantId=${TENANT_ID}`, 4000, 'finance-invoices');
  get(`/api/home/summary?tenantId=${TENANT_ID}`, 4000, 'finance-home-summary');
  sleep(1);
}
