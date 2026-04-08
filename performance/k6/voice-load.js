import { sleep } from 'k6';
import { post, TENANT_ID } from './_common.js';

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '45s', target: 20 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  post(
    '/api/ai/voice/process',
    { tenantId: TENANT_ID, text: 'Hello from k6 voice load test.' },
    15000,
    'voice-process'
  );
  sleep(1);
}
