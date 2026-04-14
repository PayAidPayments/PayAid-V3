# Load Test Results Runbook

## Command

- `npm run test:load:archive`

This runs the existing performance smoke (`tests/performance/load.test.ts`) and writes a timestamped artifact to:

- `docs/evidence/load-tests/<timestamp>-load-test.json`

## Expected artifact fields

- `collected_at_utc`
- `command`
- `exit_code`
- `output_excerpt`

## Release usage

1. Run load test command from repository root.
2. Confirm `exit_code: 0` in latest artifact.
3. Attach artifact path in release ticket/checklist.

