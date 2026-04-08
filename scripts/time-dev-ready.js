/**
 * Times Next.js dev server until "Ready" or "compiled".
 * Usage:
 *   node scripts/time-dev-ready.js turbo   -- marketing app with Turbopack (AFTER)
 *   node scripts/time-dev-ready.js webpack -- marketing app with Webpack (BEFORE)
 * Output: Writes to scripts/dev-speed-result.txt and stdout.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = (process.argv[2] || 'turbo').toLowerCase();
const resultPath = path.join(__dirname, 'dev-speed-result.txt');
const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'apps', 'marketing');
const port = mode === 'webpack' ? 3006 : 3007;

function writeResult(msg) {
  fs.writeFileSync(resultPath, msg + '\n', 'utf8');
  console.log(msg);
}

const useTurbo = mode !== 'webpack';
const args = ['next', 'dev', '-p', String(port)];
if (useTurbo) args.splice(2, 0, '--turbo');

const start = Date.now();
const child = spawn('npx', args, {
  cwd: appDir,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '0' },
});

let resolved = false;
function onReady() {
  if (resolved) return;
  resolved = true;
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const label = useTurbo ? 'AFTER_TURBO' : 'BEFORE_WEBPACK';
  writeResult(`${label}=${elapsed}s`);
  child.kill('SIGTERM');
  process.exit(0);
}

const readyPatterns = [
  /Ready in \d+/i,
  /ready in \d+/i,
  /compiled successfully/i,
  /✓ Compiled/i,
  /Compiled in \d+ms/i,
  /Local:\s*http/i,
  /localhost:\d+/i,
  /started server on/i,
  /✓ Ready/i,
  /- Local:/i,
];

function check(line) {
  const s = (line || '').toString();
  if (readyPatterns.some((p) => p.test(s))) onReady();
}

function onData(chunk) {
  String(chunk || '')
    .split('\n')
    .forEach(check);
}
child.stdout.on('data', onData);
child.stderr.on('data', onData);

const timeoutMs = useTurbo ? 90 * 1000 : 120 * 1000;
setTimeout(() => {
  if (resolved) return;
  resolved = true;
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const label = useTurbo ? 'AFTER_TURBO' : 'BEFORE_WEBPACK';
  writeResult(`${label}_TIMEOUT=${elapsed}s`);
  child.kill('SIGTERM');
  process.exit(1);
}, timeoutMs);

child.on('error', (err) => {
  writeResult(`DEV_READY_ERROR=${err.message}`);
  process.exit(1);
});
