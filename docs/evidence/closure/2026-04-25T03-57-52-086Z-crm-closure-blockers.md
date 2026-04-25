# CRM GA closure blocker run

- Timestamp: 2026-04-25T03:57:52.086Z
- Workspace: D:\Cursor Projects\PayAid V3
- Output file: D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T03-57-52-086Z-crm-closure-blockers.md
- Test timeout ms: 120000
- Skip tests: no
- Skip auth: yes

## Queue #13 — CRM unit-test confirmation

- test:crm:tasks-filters: pass (exit=0, signal=none, 47850ms)
- test:crm:merge-key: pass (exit=0, signal=none, 1917ms)
- test:crm:merge-guard: pass (exit=0, signal=none, 1801ms)
- test:crm:rbac: pass (exit=0, signal=none, 1728ms)

## Queue #14 — Auth speed baseline

- status: skipped (CRM_CLOSURE_SKIP_AUTH=1)

## Raw command logs

### test:crm:tasks-filters

- Command: `npm run test:crm:tasks-filters`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 47850

```text
> payaid-v3@0.1.0 test:crm:tasks-filters
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/tasks-list-where.test.ts
```

```text
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in D:/Cursor Projects/PayAid V3/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
PASS lib/crm/__tests__/tasks-list-where.test.ts (6.569 s)
  utcDayBounds
    √ returns UTC midnight start and end-of-day for a fixed reference (3 ms)
  buildTasksListWhere
    √ scopes to tenant only when no filters (2 ms)
    √ adds open status filter (2 ms)
    √ adds overdue filter using reference day start (3 ms)
    √ adds search OR on title and description (1 ms)
    √ ignores generic one-character search terms
    √ allows exact email lookup even when short (1 ms)
    √ adds explicit status for pending

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        13.686 s
Ran all test suites within paths "lib/crm/__tests__/tasks-list-where.test.ts".
```

### test:crm:merge-key

- Command: `npm run test:crm:merge-key`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 1917

```text
> payaid-v3@0.1.0 test:crm:merge-key
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/contact-merge-key.test.ts
```

```text
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in D:/Cursor Projects/PayAid V3/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
PASS lib/crm/__tests__/contact-merge-key.test.ts
  contactHasMergeGuardKey
    √ is false when all identifiers empty or missing (2 ms)
    √ is true when any identifier is non-empty after trim (1 ms)
  contactsShare360DuplicateKey
    √ matches on trimmed email equality
    √ matches on trimmed phone equality (1 ms)
    √ matches on trimmed GSTIN equality (1 ms)
    √ does not match when one side is empty (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.863 s, estimated 169 s
Ran all test suites within paths "lib/crm/__tests__/contact-merge-key.test.ts".
```

### test:crm:merge-guard

- Command: `npm run test:crm:merge-guard`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 1801

```text
> payaid-v3@0.1.0 test:crm:merge-guard
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/contact-merge-guard.test.ts
```

```text
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in D:/Cursor Projects/PayAid V3/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
PASS lib/crm/__tests__/contact-merge-guard.test.ts
  assertContactMergeAllowedBy360Suggestions
    √ allows merge when bypassGuard is true and does not query db (3 ms)
    √ returns MERGE_CONTACT_NOT_FOUND when either contact is missing
    √ returns MERGE_GUARD_NO_PRIMARY_KEY when primary has no email/phone/gstin (1 ms)
    √ allows merge when contacts share a duplicate key (1 ms)
    √ returns MERGE_GUARD_NO_OVERLAP when keys do not overlap

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.794 s, estimated 1 s
Ran all test suites within paths "lib/crm/__tests__/contact-merge-guard.test.ts".
```

### test:crm:rbac

- Command: `npm run test:crm:rbac`
- Exit: 0
- Signal: none
- Timed out: no
- Duration ms: 1728

```text
> payaid-v3@0.1.0 test:crm:rbac
> node node_modules/jest/bin/jest.js --config jest.crm-closure.config.js --runInBand --watchAll=false --runTestsByPath lib/crm/__tests__/rbac.test.ts
```

```text
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in D:/Cursor Projects/PayAid V3/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
PASS lib/crm/__tests__/rbac.test.ts
  assertCrmRoleAllowed
    √ allows when user has one of allowed roles (2 ms)
    √ is case-insensitive for roles (1 ms)
    √ throws CrmRoleError when role is not allowed (70 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        0.808 s, estimated 35 s
Ran all test suites within paths "lib/crm/__tests__/rbac.test.ts".
```

