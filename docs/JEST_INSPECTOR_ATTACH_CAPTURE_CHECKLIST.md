# Jest Inspector Attach + Capture Checklist

Use this checklist when a focused Jest command starts but never prints test results.

## 1) Start the inspector command

Run from repo root:

`npm run test:dashboard:query-state:inspect`

Expected terminal line includes:

`Debugger listening on ws://127.0.0.1:9229/...`

If you do not see that line, stop and rerun once.

## 2) Attach DevTools

1. Open Chrome.
2. Go to `chrome://inspect`.
3. Click **Open dedicated DevTools for Node**.
4. Select the Node target for the running Jest process.

## 3) Capture the stuck state (minimum artifacts)

Collect all of these before terminating the process:

1. **Call stack screenshot** from DevTools (Threads/Call Stack visible).
2. **Paused location screenshot** if the process auto-pauses.
3. **Console output copy** from DevTools (warnings/errors if any).
4. **Terminal output copy** from the shell running the command.

## 4) Optional deeper signal

If the process is still idle and no clear stack is shown:

1. In DevTools Console, trigger a stack sample:
   - evaluate `process._getActiveHandles().map(h => h.constructor?.name)`
   - evaluate `process._getActiveRequests().map(r => r.constructor?.name)`
2. Copy results into your notes.

## 5) End run cleanly

After capture:

1. Stop the process (`Ctrl+C` in terminal).
2. Record timestamp and machine context (Windows build, shell used).

## 6) Suggested handoff template

Use this template in chat/issue comments:

- Command: `npm run test:dashboard:query-state:inspect`
- Start time:
- Observed terminal output:
- DevTools attached: yes/no
- Top call stack frame:
- Active handles:
- Active requests:
- Screenshots attached: yes/no
- Notes:

