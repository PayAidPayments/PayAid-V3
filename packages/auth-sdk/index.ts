// Auth SDK - Reusable authentication logic for all modules
// This package provides a unified auth interface that works across all PayAid modules

// Client-side exports (safe for use in client components)
export * from './useAuth';
export * from './utils';

// Server-side exports (only for API routes and server components)
// Import these directly: import { getSessionToken } from '@/packages/auth-sdk/client'
// Do NOT export from index to avoid bundling server code in client

