import crypto from 'node:crypto'

// 48 raw bytes -> 64-char URL-safe base64-ish string after replacements.
const secret = crypto
  .randomBytes(48)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '')

console.log(secret)
