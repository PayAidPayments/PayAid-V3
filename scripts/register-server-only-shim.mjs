/**
 * Preload: allow scripts to import server-only modules outside Next.
 * Usage: node --import ./scripts/register-server-only-shim.mjs --import tsx ...
 */
import Module from 'node:module'
import { pathToFileURL } from 'node:url'

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') {
    return {}
  }
  return originalLoad.apply(this, arguments)
}

// Also cover ESM bare imports via unresolved path alias if needed.
void pathToFileURL
