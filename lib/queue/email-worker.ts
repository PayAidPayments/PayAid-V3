/**
 * PayAid Mail queue worker bootstrap.
 * Run with: npx tsx lib/queue/email-worker.ts
 */
import { setupEmailWorkflowProcessors } from '@/lib/jobs/email-processors'

setupEmailWorkflowProcessors()
console.log('[email-worker] listening for email-sync, email-send, and email-campaign-dispatch jobs')
