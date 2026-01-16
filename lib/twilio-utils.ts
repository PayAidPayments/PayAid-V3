/**
 * Twilio Utility Functions
 * Handles Twilio webhook signature verification and helper functions
 */

import crypto from 'crypto';

/**
 * Verify Twilio webhook signature
 * @param url - The full URL of the webhook endpoint
 * @param params - The POST parameters from Twilio
 * @param signature - The X-Twilio-Signature header value
 * @param authToken - Twilio Auth Token
 * @returns true if signature is valid
 */
export function verifyTwilioSignature(
  url: string,
  params: string | URLSearchParams,
  signature: string,
  authToken: string
): boolean {
  if (!signature || !authToken) {
    console.warn('[Twilio] Missing signature or auth token');
    return false;
  }

  try {
    // Convert params to string if it's URLSearchParams
    const paramString = typeof params === 'string' 
      ? params 
      : new URLSearchParams(params).toString();

    // Create the signature string
    const data = url + paramString;
    
    // Compute HMAC
    const computedSignature = crypto
      .createHmac('sha1', authToken)
      .update(data, 'utf-8')
      .digest('base64');

    // Compare signatures (use timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    console.error('[Twilio] Signature verification error:', error);
    return false;
  }
}

/**
 * Format phone number to E.164 format
 * @param phoneNumber - Phone number in any format
 * @returns E.164 formatted number (e.g., +1234567890)
 */
export function formatE164(phoneNumber: string): string {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
    return `+1${cleaned.replace(/\D/g, '')}`;
  }
  
  return cleaned;
}

/**
 * Parse Twilio webhook parameters
 */
export function parseTwilioWebhook(body: string): {
  callSid: string;
  from: string;
  to: string;
  callStatus: string;
  [key: string]: string;
} {
  const params = new URLSearchParams(body);
  
  return {
    callSid: params.get('CallSid') || '',
    from: params.get('From') || '',
    to: params.get('To') || '',
    callStatus: params.get('CallStatus') || '',
    ...Object.fromEntries(params.entries())
  };
}
