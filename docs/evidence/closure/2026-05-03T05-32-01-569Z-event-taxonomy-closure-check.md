# Event Taxonomy Closure Check

- Started: 2026-05-03T05:28:43.123Z
- Finished: 2026-05-03T05:32:01.569Z
- Mode: hybrid
- Timeout ms: 600000
- Per-suite timeout ms: 600000
- Pass: true
- Runs: 7

## Run Details

### Run 1

- Tests: __tests__/m0/m0-event-taxonomy-contract.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 158112
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-event-taxonomy-contract.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-event-taxonomy-contract.test.ts (7.376 s)
  event taxonomy contracts
    √ accepts canonical event types (3 ms)
    √ rejects unknown event types (188 ms)
    √ enforces taxonomy in outbox queue payload validation (44 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        15.083 s
Ran all test suites within paths "__tests__/m0/m0-event-taxonomy-contract.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

### Run 2

- Tests: __tests__/m0/m0-non-leads-queue-contracts.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 3039
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-non-leads-queue-contracts.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-non-leads-queue-contracts.test.ts
  non-leads queue job contracts
    √ accepts valid outbox dispatch payload (3 ms)
    √ rejects invalid send-marketing-campaign payload (8 ms)
    √ accepts scheduler and marketing post dispatch payloads (1 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        2.109 s
Ran all test suites within paths "__tests__/m0/m0-non-leads-queue-contracts.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

### Run 3

- Tests: __tests__/m0/m0-shared-business-graph-contract.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 7914
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-shared-business-graph-contract.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-shared-business-graph-contract.test.ts (6.672 s)
  shared business graph contracts
    √ accepts both cuid and uuid entity ids (5 ms)
    √ enforces canonical business entity references (1 ms)
    √ applies shared entity-id contract in finance and productivity create schemas (2 ms)
    √ applies shared entity-id contract in crm create schema
    √ enforces business-graph module set in analytics widget datasource
    √ validates lead activation cross-module payload shape
    √ applies shared contracts in inventory create schemas (1 ms)
    √ validates lead discovery queue payload contract parity
    √ validates enrich/resolve/score queue payload guard parity (1 ms)
    √ validates contact/segment queue payload guard parity (1 ms)
    √ validates start-sequence/export/audit queue payload guard parity (4 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        7.481 s, estimated 31 s
Ran all test suites within paths "__tests__/m0/m0-shared-business-graph-contract.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

### Run 4

- Tests: __tests__/m0/m0-outbox.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 12550
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-outbox.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-outbox.test.ts (11.59 s)
  M0 outbox reliability baseline
    √ queues outbox event with retry options (3 ms)
    √ writes dead-letter audit entry when queue add fails (179 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        11.879 s, estimated 58 s
Ran all test suites within paths "__tests__/m0/m0-outbox.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

### Run 5

- Tests: __tests__/m0/m0-outbox-dispatcher.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 1922
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-outbox-dispatcher.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-outbox-dispatcher.test.ts
  M0 outbox dispatcher
    √ initializes dispatcher only once (2 ms)
    √ returns aggregated outbox metrics (1 ms)
    √ requeues DLQ outbox event for replay (1 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.246 s
Ran all test suites within paths "__tests__/m0/m0-outbox-dispatcher.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

### Run 6

- Tests: __tests__/m0/m0-outbox-health.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 2170
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-outbox-health.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-outbox-health.test.ts
  M0 outbox health
    √ returns health status with last dispatch and dlq (4 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        1.03 s
Ran all test suites within paths "__tests__/m0/m0-outbox-health.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

### Run 7

- Tests: __tests__/m0/m0-outbox-reconciliation-routes.test.ts
- Timed out: false
- Exit code: 0
- Exit signal: null
- Elapsed ms: 12697
- Pass: true

```
node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-outbox-reconciliation-routes.test.ts --forceExit
```

#### Stdout (tail)
```

```

#### Stderr (tail)
```
PASS __tests__/m0/m0-outbox-reconciliation-routes.test.ts (11.61 s)
  M0 outbox reconciliation route hardening
    √ returns 429 when manual reconciliation run is on cooldown (11 ms)
    √ exports reconciliation history as csv with applied filters (13 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        12.237 s
Ran all test suites within paths "__tests__/m0/m0-outbox-reconciliation-routes.test.ts".
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?

```

