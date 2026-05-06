import { spawn } from 'node:child_process'

const timeoutMs = Number(process.env.JEST_DIAG_TIMEOUT_MS || 45000)
const jestArgs = [
  'node_modules/jest/bin/jest.js',
  '--runInBand',
  '--watchAll=false',
  '--verbose',
  '--detectOpenHandles',
  '--forceExit',
  '--runTestsByPath',
  'apps/dashboard/__tests__/query-state.test.ts',
]

const child = spawn(process.execPath, jestArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let stdout = ''
let stderr = ''
let timedOut = false

child.stdout.on('data', (chunk) => {
  const text = String(chunk)
  stdout += text
  process.stdout.write(text)
})

child.stderr.on('data', (chunk) => {
  const text = String(chunk)
  stderr += text
  process.stderr.write(text)
})

const timer = setTimeout(() => {
  timedOut = true
  process.stderr.write(`\n[diag] Timeout after ${timeoutMs}ms. Terminating Jest process tree...\n`)
  // On Windows, /T ensures spawned subprocesses are also terminated.
  const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'pipe' })
  killer.stdout.on('data', (chunk) => process.stderr.write(String(chunk)))
  killer.stderr.on('data', (chunk) => process.stderr.write(String(chunk)))
}, timeoutMs)

child.on('close', (code, signal) => {
  clearTimeout(timer)
  const outTail = stdout.split('\n').slice(-20).join('\n')
  const errTail = stderr.split('\n').slice(-20).join('\n')
  process.stderr.write('\n[diag] ---- summary ----\n')
  process.stderr.write(`[diag] exit_code=${code ?? 'null'} signal=${signal ?? 'null'} timed_out=${timedOut}\n`)
  process.stderr.write(`[diag] stdout_bytes=${Buffer.byteLength(stdout)} stderr_bytes=${Buffer.byteLength(stderr)}\n`)
  process.stderr.write('[diag] stdout_tail:\n')
  process.stderr.write(`${outTail}\n`)
  process.stderr.write('[diag] stderr_tail:\n')
  process.stderr.write(`${errTail}\n`)
  process.exit(timedOut ? 124 : (code ?? 1))
})
