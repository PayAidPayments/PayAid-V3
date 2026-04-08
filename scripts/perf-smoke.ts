const baseUrl = (process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

async function fetchWithTimeout(path: string, timeoutMs: number): Promise<{ ms: number; status: number }> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'text/html,*/*' },
    });
    return { ms: Date.now() - started, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const checks = [
    { path: '/login', timeoutMs: 120_000, maxMs: 180_000 },
    { path: '/api/payaid-internal/ping', timeoutMs: 120_000, maxMs: 180_000 },
  ];

  let failed = false;

  for (const check of checks) {
    try {
      const result = await fetchWithTimeout(check.path, check.timeoutMs);
      const ok = result.status < 500 && result.ms <= check.maxMs;
      const status = ok ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${check.path} status=${result.status} time=${result.ms}ms`);
      if (!ok) failed = true;
    } catch (error) {
      failed = true;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[FAIL] ${check.path} error=${message}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }
  console.log('Smoke check passed.');
}

void main();
