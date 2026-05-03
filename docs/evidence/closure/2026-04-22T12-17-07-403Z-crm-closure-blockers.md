# CRM GA closure blocker run

- Timestamp: 2026-04-22T12:17:07.403Z
- Workspace: D:\Cursor Projects\PayAid V3
- Output file: D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-22T12-17-07-403Z-crm-closure-blockers.md
- Test timeout ms: 120000
- Skip tests: no
- Skip auth: yes

## Queue #13 — CRM unit-test confirmation

- test:crm:tasks-filters: timeout (exit=null, signal=SIGTERM, 120056ms)
- test:crm:merge-key: timeout (exit=null, signal=SIGTERM, 120068ms)
- test:crm:merge-guard: timeout (exit=null, signal=SIGTERM, 120053ms)
- test:crm:rbac: timeout (exit=null, signal=SIGTERM, 120073ms)

## Queue #14 — Auth speed baseline

- status: skipped (CRM_CLOSURE_SKIP_AUTH=1)

## Raw command logs

### test:crm:tasks-filters

- Command: `npm run test:crm:tasks-filters`
- Exit: null
- Signal: SIGTERM
- Timed out: yes
- Duration ms: 120056
- Error: spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT

```text
> payaid-v3@0.1.0 test:crm:tasks-filters
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/tasks-list-where.test.ts
```

### test:crm:merge-key

- Command: `npm run test:crm:merge-key`
- Exit: null
- Signal: SIGTERM
- Timed out: yes
- Duration ms: 120068
- Error: spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT

```text
> payaid-v3@0.1.0 test:crm:merge-key
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/contact-merge-key.test.ts
```

### test:crm:merge-guard

- Command: `npm run test:crm:merge-guard`
- Exit: null
- Signal: SIGTERM
- Timed out: yes
- Duration ms: 120053
- Error: spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT

```text
> payaid-v3@0.1.0 test:crm:merge-guard
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/contact-merge-guard.test.ts
```

### test:crm:rbac

- Command: `npm run test:crm:rbac`
- Exit: null
- Signal: SIGTERM
- Timed out: yes
- Duration ms: 120073
- Error: spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT

```text
> payaid-v3@0.1.0 test:crm:rbac
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/rbac.test.ts
```

