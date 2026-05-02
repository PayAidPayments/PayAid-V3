import { beforeAll, describe, expect, it } from '@jest/globals'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const TIMELINE_GITHUB_WORKFLOWS_REL_PATH = path.join('.github', 'workflows')
const TIMELINE_CONTRACTS_RELEASE_GATE_WORKFLOW_FILENAME = 'timeline-contracts-release-gate.yml'
const TIMELINE_WIRING_PACKAGE_JSON_FILENAME = 'package.json'
const TIMELINE_WIRING_PACKAGE_GATE_SUITE_SCRIPT = 'scripts/run-release-gate-suite.mjs'
const TIMELINE_WIRING_JEST_M0_CONFIG_FILENAME = 'jest.m0.config.js'
/** Canonical relpath for this contract module; drives header pins + path-filter needles + M0-runner pins (Phase 310). */
const TIMELINE_CONTRACT_SUITE_RELPATH = '__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts' as const
const TIMELINE_WORKFLOW_RUN_LINE_PREFIX = 'run: npm run '
const TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_HANDOFF_PACK = 'show:release-gate-warn-only:pointer:handoff-pack'
const TIMELINE_WORKFLOW_STRICT_HANDOFF_PACK_MARKER_PREFIX = `${TIMELINE_WORKFLOW_RUN_LINE_PREFIX}${TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_HANDOFF_PACK}`

const TIMELINE_WORKFLOW_NPM_SCRIPT_RUN_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT =
  'run:release-gate-warn-only:pointer:handoff-schema-check-artifact'
const TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_PACK_SOFT = 'show:release-gate-warn-only:pointer-pack:soft'
const TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_SUFFIX = ':namespaced'
const TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX = `${TIMELINE_WORKFLOW_RUN_LINE_PREFIX}${TIMELINE_WORKFLOW_NPM_SCRIPT_RUN_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT}`
const TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_RUN_LINE = `${TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX}${TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_SUFFIX}`
/** Plain writer line only; `indexOf(RUN_LINE_PREFIX)` also matches the namespaced line (prefix overlap). */
const TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_PLAIN_RUN_LINE = `${TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_RUN_LINE_PREFIX}\n`
const TIMELINE_WORKFLOW_POINTER_PACK_SOFT_RUN_LINE_PREFIX = `${TIMELINE_WORKFLOW_RUN_LINE_PREFIX}${TIMELINE_WORKFLOW_NPM_SCRIPT_SHOW_POINTER_PACK_SOFT}`
const TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX = {
  min1: ':json-line:strict-schema:min1',
  min1Namespaced: ':json-line:strict-schema:namespaced:min1',
  checkOnly: ':schema-check-only',
  checkJsonLine: ':schema-check-json-line',
  checkCodeOnly: ':schema-check-code-only',
  checkEnvLine: ':schema-check-env-line',
  handoffCompleteness: '',
} as const
const TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS = ['checkOnly', 'checkJsonLine', 'checkCodeOnly', 'checkEnvLine'] as const
type TimelineNamespacedStrictSuffixKey = (typeof TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS)[number]
function withNamespacedSuffix(key: TimelineNamespacedStrictSuffixKey) {
  return `${TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX[key]}${TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_SUFFIX}`
}
function buildNamedNamespacedStrictSuffixes() {
  const namespacedStrictSuffixKeys = TIMELINE_NAMESPACED_STRICT_SUFFIX_KEYS
  const mapNamespacedStrictSuffix = withNamespacedSuffix
  const namespacedStrictSuffixes = namespacedStrictSuffixKeys.map(mapNamespacedStrictSuffix)
  const [
    checkOnlyNamespacedSuffix,
    checkJsonLineNamespacedSuffix,
    checkCodeOnlyNamespacedSuffix,
    checkEnvLineNamespacedSuffix,
  ] = namespacedStrictSuffixes

  const namedNamespacedStrictSuffixes = {
    checkOnlyNamespacedSuffix,
    checkJsonLineNamespacedSuffix,
    checkCodeOnlyNamespacedSuffix,
    checkEnvLineNamespacedSuffix,
  } as const

  return namedNamespacedStrictSuffixes
}
function buildTimelineStrictSchemaMarkerSuffixes() {
  const namedNamespacedStrictSuffixBag = buildNamedNamespacedStrictSuffixes()
  const {
    checkOnlyNamespacedSuffix,
    checkJsonLineNamespacedSuffix,
    checkCodeOnlyNamespacedSuffix,
    checkEnvLineNamespacedSuffix,
  } = namedNamespacedStrictSuffixBag

  // Row order matches the timeline release-gate workflow strict marker sequence; do not reorder without updating workflow YAML and these tests.
  const orderedStrictSchemaMarkerSuffixRow = [
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.min1,
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.min1Namespaced,
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.checkOnly,
    checkOnlyNamespacedSuffix,
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.checkJsonLine,
    checkJsonLineNamespacedSuffix,
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.checkCodeOnly,
    checkCodeOnlyNamespacedSuffix,
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.checkEnvLine,
    checkEnvLineNamespacedSuffix,
    TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIX.handoffCompleteness,
  ] as const

  return orderedStrictSchemaMarkerSuffixRow
}
const TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES = buildTimelineStrictSchemaMarkerSuffixes()

/**
 * Timeline workflow contract suite maintenance note:
 * - Add a new `it(...)` block only for a clearly new contract surface.
 * - Top-level `describe` uses `TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE` (Phase 315); nested blocks use their own title constants.
 * - Prefer extending an existing section when a change strengthens
 *   an already-covered surface (ordering, wiring, or gate pinning).
 * - `npm run release:gate:timeline-contracts` runs this file via gate `workflow-automation-contracts`
 *   only when it appears in `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` inside
 *   `scripts/run-workflow-automation-closure-check.mjs` (spread to `tests` + startup guards); keep that list in sync when renaming this module.
 *
 * @see scripts/run-workflow-automation-closure-check.mjs — `M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST` inside `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` (Phase 291).
 */
function readRepoFiles() {
  const root = process.cwd()
  const workflow = readFileSync(
    path.join(root, TIMELINE_GITHUB_WORKFLOWS_REL_PATH, TIMELINE_CONTRACTS_RELEASE_GATE_WORKFLOW_FILENAME),
    'utf8'
  )
  const packageJson = readFileSync(path.join(root, TIMELINE_WIRING_PACKAGE_JSON_FILENAME), 'utf8')
  const gateSuite = readFileSync(path.join(root, TIMELINE_WIRING_PACKAGE_GATE_SUITE_SCRIPT), 'utf8')
  const jestM0Config = readFileSync(path.join(root, TIMELINE_WIRING_JEST_M0_CONFIG_FILENAME), 'utf8')
  return { workflow, packageJson, gateSuite, jestM0Config }
}

function indexOrFail(haystack: string, needle: string) {
  const idx = haystack.indexOf(needle)
  expect(idx).toBeGreaterThan(-1)
  return idx
}

function expectAscending(indexes: number[]) {
  for (let i = 1; i < indexes.length; i += 1) {
    expect(indexes[i - 1]).toBeLessThan(indexes[i])
  }
}

function expectNthOccurrenceIndex(haystack: string, needle: string, oneBasedIndex: number) {
  let idx = -1
  for (let i = 0; i < oneBasedIndex; i += 1) {
    idx = haystack.indexOf(needle, idx + 1)
    expect(idx).toBeGreaterThan(-1)
  }
  return idx
}

function expectSingleSlugToken(value: string) {
  expect(value.length).toBeGreaterThan(0)
  expect(value).toBe(value.trim())
  expect(value).toMatch(/^[a-z0-9-]+$/)
}

const TIMELINE_WARN_ONLY_GATE = 'prisma-generate-closure-contracts'

const TIMELINE_GATE_WORKFLOW_AUTOMATION_CONTRACTS = 'workflow-automation-contracts'
const TIMELINE_GATE_CRM_TIMELINE_ROUTES_CONTRACTS = 'crm-timeline-routes-contracts'

const TIMELINE_GATE_SUITE_ID_M0 = 'm0'
const TIMELINE_GATE_SUITE_ID_M0_DEEPLINK_CONTEXT_CONTRACTS = 'm0-deeplink-context-contracts'

const TIMELINE_GATE_TOKENS = [
  TIMELINE_GATE_WORKFLOW_AUTOMATION_CONTRACTS,
  TIMELINE_GATE_CRM_TIMELINE_ROUTES_CONTRACTS,
  TIMELINE_GATE_SUITE_ID_M0_DEEPLINK_CONTEXT_CONTRACTS,
  TIMELINE_WARN_ONLY_GATE,
] as const

const TIMELINE_GATE_LIST = TIMELINE_GATE_TOKENS.join(',')
const TIMELINE_GATE_TOKEN_SET = new Set(TIMELINE_GATE_TOKENS)

if (TIMELINE_GATE_TOKENS.length !== TIMELINE_GATE_TOKEN_SET.size) {
  throw new Error(
    `Timeline workflow contracts: TIMELINE_GATE_TOKENS must contain no duplicates (length ${TIMELINE_GATE_TOKENS.length}, distinct ${TIMELINE_GATE_TOKEN_SET.size})`
  )
}

const TIMELINE_RELEASE_GATE_SCRIPT = 'release:gate:timeline-contracts'
const TIMELINE_RELEASE_GATE_SCRIPT_JSON_KEY = `"${TIMELINE_RELEASE_GATE_SCRIPT}"`
/** Must stay aligned with `.github/workflows/timeline-contracts-release-gate.yml` env + local spawn budgets. */
const TIMELINE_RELEASE_GATE_SCRIPT_TIMEOUT_SNIPPETS = [
  'WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS=900000',
  'WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS=300000',
  'CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS=300000',
  'M0_DEEPLINK_CONTEXT_TIMEOUT_MS=120000',
  'PRISMA_GENERATE_CLOSURE_TIMEOUT_MS=300000',
  'RELEASE_GATE_TIMEOUT_MS_WORKFLOW_AUTOMATION_CONTRACTS=960000',
  'RELEASE_GATE_TIMEOUT_MS_CRM_TIMELINE_ROUTES_CONTRACTS=420000',
  'RELEASE_GATE_TIMEOUT_MS_M0_DEEPLINK_CONTEXT_CONTRACTS=150000',
  'RELEASE_GATE_TIMEOUT_MS_PRISMA_GENERATE_CLOSURE_CONTRACTS=420000',
] as const
/** Indent matches `timeline-contracts-release-gate.yml` under `Run timeline contracts release gate` → `env:`. */
const TIMELINE_GITHUB_RELEASE_GATE_STEP_ENV_LINES = [
  "          WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS: '900000'",
  "          WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS: '300000'",
  "          CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS: '300000'",
  "          M0_DEEPLINK_CONTEXT_TIMEOUT_MS: '120000'",
  "          PRISMA_GENERATE_CLOSURE_TIMEOUT_MS: '300000'",
  "          RELEASE_GATE_TIMEOUT_MS_WORKFLOW_AUTOMATION_CONTRACTS: '960000'",
  "          RELEASE_GATE_TIMEOUT_MS_CRM_TIMELINE_ROUTES_CONTRACTS: '420000'",
  "          RELEASE_GATE_TIMEOUT_MS_M0_DEEPLINK_CONTEXT_CONTRACTS: '150000'",
  "          RELEASE_GATE_TIMEOUT_MS_PRISMA_GENERATE_CLOSURE_CONTRACTS: '420000'",
] as const
/** First three `paths:` entries under each `on:` trigger (PR + push); gate wiring + CI must stay in sync. */
const TIMELINE_GITHUB_PATH_FILTER_HEAD = [
  "      - '.github/workflows/timeline-contracts-release-gate.yml'",
  "      - 'package.json'",
  "      - 'jest.m0.config.js'",
] as const
const TIMELINE_GITHUB_PATH_FILTER_HEAD_BLOCK = TIMELINE_GITHUB_PATH_FILTER_HEAD.join('\n')
/** Each appears under both `pull_request` and `push` `paths:` in the timeline gate workflow. */
const TIMELINE_GITHUB_PATH_FILTER_GATE_RUNNER_LINES = [
  `      - '${TIMELINE_CONTRACT_SUITE_RELPATH}'`,
  "      - 'scripts/run-release-gate-suite.mjs'",
] as const
const TIMELINE_GITHUB_PATH_FILTER_WORKFLOW_AUTOMATION_CLOSURE_SCRIPT_LINE =
  "      - 'scripts/run-workflow-automation-closure-check.mjs'"
/** CRM timeline, deeplink context, and prisma generate closure runners (Phase 306); each listed twice under PR + push `paths:`. */
const TIMELINE_GITHUB_PATH_FILTER_REMAINING_CLOSURE_RUNNER_LINES = [
  "      - 'scripts/run-crm-timeline-routes-closure-check.mjs'",
  "      - 'scripts/run-m0-deeplink-context-check.mjs'",
  "      - 'scripts/run-prisma-generate-closure-check.mjs'",
] as const
const TIMELINE_RELEASE_GATES_ENV = 'RELEASE_GATES'
const TIMELINE_RELEASE_GATE_WARN_ONLY_ENV = 'RELEASE_GATE_WARN_ONLY_GATES'

const TIMELINE_WIRING_PACKAGE_TEST_M0_JSON_KEY = '"test:m0"'
const TIMELINE_WIRING_JEST_M0_ROOTS_SNIPPET = "roots: ['<rootDir>/__tests__/m0']"
const TIMELINE_WIRING_JEST_M0_FORCE_EXIT_SNIPPET = 'forceExit: true'
const TIMELINE_WORKFLOW_AUTOMATION_CLOSURE_SCRIPT_RELPATH = path.join(
  'scripts',
  'run-workflow-automation-closure-check.mjs'
)

/** Top-level contract suite `describe`; keep stable for `jest -t` filters (Phase 315). */
const TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE =
  'timeline release-gate workflow contracts' as const

/** Nested wiring `describe`; keep stable for `jest -t` filters. */
const TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE = 'timeline release-gate wiring' as const

/** Must match `# Jest pins:` workflow header line in `.github/workflows/timeline-contracts-release-gate.yml` (Phase 316). */
const TIMELINE_GITHUB_WORKFLOW_JEST_CONTRACT_HEADER_LINE =
  `# Jest pins: ${TIMELINE_CONTRACT_SUITE_RELPATH} — describe '${TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE}', nested describe '${TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE}'.`

/** Nested `describe` title for closure-runner source-parse tests; keep stable for `jest -t` filters and phase log cross-refs. */
const WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE =
  'workflow-automation closure runner source' as const

/** Single-line marker in `run-workflow-automation-closure-check.mjs` after module JSDoc (Phases 309, 317). */
const WORKFLOW_AUTOMATION_CLOSURE_RUNNER_JEST_CONTRACT_HEADER_LINE =
  `// Jest pins: ${TIMELINE_CONTRACT_SUITE_RELPATH} — describe '${TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE}', nested describe '${WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE}'.`

/** Line above `M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST` in `run-workflow-automation-closure-check.mjs` (Phase 311). */
const WORKFLOW_AUTOMATION_CLOSURE_RUNNER_M0_TIMELINE_PH311_COMMENT_LINE =
  `// Phase 311: literal must equal TIMELINE_CONTRACT_SUITE_RELPATH (${TIMELINE_CONTRACT_SUITE_RELPATH}).`

/** Line above `workflow-automation-contracts` gate in `run-release-gate-suite.mjs` (Phase 312). */
const RELEASE_GATE_SUITE_WORKFLOW_AUTOMATION_PH312_COMMENT_LINE =
  `// Phase 312: workflow-automation-contracts gate -> run-workflow-automation-closure-check.mjs (M0_TIMELINE_* mirrors TIMELINE_CONTRACT_SUITE_RELPATH, Phase 311; ${TIMELINE_CONTRACT_SUITE_RELPATH}).`

/** Lines above CRM / deeplink / prisma timeline gates in `run-release-gate-suite.mjs` (Phase 313). */
const RELEASE_GATE_SUITE_TIMELINE_BUNDLE_CLOSURE_PH313_COMMENT_LINES = [
  `// Phase 313: crm-timeline-routes-contracts gate -> run-crm-timeline-routes-closure-check.mjs (timeline RELEASE_GATES bundle; wiring alongside ${TIMELINE_CONTRACT_SUITE_RELPATH}).`,
  `// Phase 313: m0-deeplink-context-contracts gate -> run-m0-deeplink-context-check.mjs (timeline RELEASE_GATES bundle; wiring alongside ${TIMELINE_CONTRACT_SUITE_RELPATH}).`,
  `// Phase 313: prisma-generate-closure-contracts gate -> run-prisma-generate-closure-check.mjs (timeline RELEASE_GATES bundle, warn-only in release:gate:timeline-contracts; wiring alongside ${TIMELINE_CONTRACT_SUITE_RELPATH}).`,
] as const

/** First script body line pointer in `run-release-gate-suite.mjs` after imports (Phases 314, 317). */
const RELEASE_GATE_SUITE_JEST_CONTRACT_HEADER_LINE =
  `// Jest pins: ${TIMELINE_CONTRACT_SUITE_RELPATH} — describe '${TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE}'; release-gate orchestration (timeline bundle gate rows: Phase 312–313).`

/** Must match `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` approval entries in `run-workflow-automation-closure-check.mjs` (before M0 binding). */
const WORKFLOW_AUTOMATION_CLOSURE_APPROVAL_TEST_PATHS = [
  '__tests__/m0/m0-workflow-engine-approval-gating.test.ts',
  '__tests__/m0/m0-workflow-approval-decisions.test.ts',
  '__tests__/m0/m0-workflow-approval-decision-route.test.ts',
  '__tests__/m0/m0-workflow-approvals-list-route.test.ts',
] as const

function expectWarnOnlyGateInvariants(warnOnlyValue: string, gateTokens: string[]) {
  expect(gateTokens).toContain(warnOnlyValue)
  expect(gateTokens.filter((token) => token === warnOnlyValue)).toHaveLength(1)
  expect(warnOnlyValue).toBe(gateTokens[gateTokens.length - 1])
  expectSingleSlugToken(warnOnlyValue)
  expect(warnOnlyValue).toMatch(/^[^,\s]+$/)
  expect(warnOnlyValue).not.toContain(',')
}

function expectTimelineWarnOnlyGatePinned(warnOnlyValue: string) {
  expect(warnOnlyValue).toBe(TIMELINE_WARN_ONLY_GATE)
}

function expectTimelineWarnOnlyContracts(warnOnlyValue: string, gateTokens: string[]) {
  expectTimelineWarnOnlyGatePinned(warnOnlyValue)
  expectWarnOnlyGateInvariants(warnOnlyValue, gateTokens)
}

function expectTimelineGateListInvariants(gateList: string) {
  expect(gateList).toBe(TIMELINE_GATE_LIST)
  const gateTokens = gateList.split(',')
  expect(gateTokens).toEqual(TIMELINE_GATE_TOKENS)
  expect(gateTokens).toHaveLength(TIMELINE_GATE_TOKEN_SET.size)
  expect(new Set(gateTokens)).toEqual(TIMELINE_GATE_TOKEN_SET)
  for (const gateToken of gateTokens) {
    expectSingleSlugToken(gateToken)
  }
  return gateTokens
}

function expectTimelineReleaseGateScriptCommandInvariants(scriptCommand: string) {
  expect(scriptCommand).toContain(`${TIMELINE_RELEASE_GATES_ENV}=`)
  expect(scriptCommand).toContain(`${TIMELINE_RELEASE_GATE_WARN_ONLY_ENV}=`)
}

type TimelineGateParse = { scriptCommand: string; token: string }
type TimelineGateParserFlow = { gateList: string; warnOnlyValue: string }

function expectTimelineReleaseGateParserPairInvariants(
  gateParse: TimelineGateParse,
  warnOnlyParse: TimelineGateParse
) {
  expectTimelineReleaseGateScriptCommandInvariants(gateParse.scriptCommand)
  expect(gateParse.scriptCommand).toBe(warnOnlyParse.scriptCommand)
}

function expectTimelineReleaseGateScriptPresent(packageJson: string) {
  expect(packageJson).toContain(TIMELINE_RELEASE_GATE_SCRIPT_JSON_KEY)
}

function readTimelineReleaseGateEnvToken(packageJson: string, envVar: string): TimelineGateParse {
  expectTimelineReleaseGateScriptPresent(packageJson)
  const escapedEnvVar = envVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `"${TIMELINE_RELEASE_GATE_SCRIPT}":\\s*"([^"]*${escapedEnvVar}=([^"\\s]+)[^"]*)"`
  )
  const match = packageJson.match(pattern)
  if (!match) {
    throw new Error(`Missing ${envVar} token in ${TIMELINE_RELEASE_GATE_SCRIPT} script`)
  }
  const scriptCommand = match?.[1] ?? ''
  if (!scriptCommand) {
    throw new Error(`Failed to capture script command while parsing ${envVar}`)
  }
  const token = match?.[2] ?? ''
  if (!token) {
    throw new Error(`Failed to capture ${envVar} token value`)
  }
  return { scriptCommand, token }
}

function readTimelineGateParserFlow(packageJson: string): TimelineGateParserFlow {
  const gateParse = readTimelineReleaseGateEnvToken(packageJson, TIMELINE_RELEASE_GATES_ENV)
  const warnOnlyParse = readTimelineReleaseGateEnvToken(packageJson, TIMELINE_RELEASE_GATE_WARN_ONLY_ENV)
  expectTimelineReleaseGateParserPairInvariants(gateParse, warnOnlyParse)
  return { gateList: gateParse.token, warnOnlyValue: warnOnlyParse.token }
}

function expectTimelineParserContracts(packageJson: string): TimelineGateParserFlow {
  return readTimelineGateParserFlow(packageJson)
}

function expectTimelineReleaseGateContracts(packageJson: string) {
  const { gateList, warnOnlyValue } = expectTimelineParserContracts(packageJson)
  const gateTokens = expectTimelineGateListInvariants(gateList)
  expectTimelineWarnOnlyContracts(warnOnlyValue, gateTokens)
}

describe(TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE, () => {
  // Artifact materialization ordering guards.
  it('keeps strict namespaced/plain schema-check artifact writes before pointer-pack', () => {
    const { workflow } = readRepoFiles()
    const namespacedNeedle = `${TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_NAMESPACED_RUN_LINE}\n`
    const plainNeedle = TIMELINE_WORKFLOW_ARTIFACT_HANDOFF_SCHEMA_CHECK_PLAIN_RUN_LINE
    const pointerPackNeedle = `${TIMELINE_WORKFLOW_POINTER_PACK_SOFT_RUN_LINE_PREFIX}\n`

    const namespacedIndex = indexOrFail(workflow, namespacedNeedle)
    const plainIndex = indexOrFail(workflow, plainNeedle)
    const pointerPackIndex = indexOrFail(workflow, pointerPackNeedle)

    expectAscending([namespacedIndex, plainIndex, pointerPackIndex])
  })

  // Strict schema gate sequence guards.
  it('keeps strict schema gate sequence and strict handoff completeness order', () => {
    const { workflow } = readRepoFiles()
    // Terminate with newline so `indexOf` does not match earlier `:soft` run lines that extend the same prefix.
    const strictMarkers = TIMELINE_WORKFLOW_STRICT_SCHEMA_MARKER_SUFFIXES.map(
      (suffix) => `${TIMELINE_WORKFLOW_STRICT_HANDOFF_PACK_MARKER_PREFIX}${suffix}\n`
    )

    const indexes = strictMarkers.map((m) => indexOrFail(workflow, m))
    expectAscending(indexes)
  })

  // Workflow -> package -> gate-suite wiring guards (split it() after Phases 303–306 growth).
  describe(TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE, () => {
    let wiringWorkflow: string
    let wiringPackageJson: string
    let wiringGateSuite: string
    let wiringJestM0Config: string
    let contractSuiteSource: string

    beforeAll(() => {
      const files = readRepoFiles()
      const root = process.cwd()
      wiringWorkflow = files.workflow
      wiringPackageJson = files.packageJson
      wiringGateSuite = files.gateSuite
      wiringJestM0Config = files.jestM0Config
      contractSuiteSource = readFileSync(path.join(root, TIMELINE_CONTRACT_SUITE_RELPATH), 'utf8')
    })

    it('pins top-level + nested wiring describe constants + timeline workflow Jest pointer line', () => {
      expect(contractSuiteSource).toContain(
        'describe(TIMELINE_RELEASE_GATE_CONTRACT_SUITE_DESCRIBE_TITLE, () => {'
      )
      expect(contractSuiteSource).toContain(
        'describe(TIMELINE_RELEASE_GATE_WIRING_DESCRIBE_TITLE, () => {'
      )
      expect(wiringWorkflow).toContain(TIMELINE_GITHUB_WORKFLOW_JEST_CONTRACT_HEADER_LINE)
    })

    it('pins timeline GitHub workflow npm run release:gate and step env timeouts', () => {
      expect(wiringWorkflow).toContain(`${TIMELINE_WORKFLOW_RUN_LINE_PREFIX}${TIMELINE_RELEASE_GATE_SCRIPT}`)
      for (const line of TIMELINE_GITHUB_RELEASE_GATE_STEP_ENV_LINES) {
        expect(wiringWorkflow).toContain(line)
      }
    })

    it('pins timeline GitHub workflow PR + push path filters', () => {
      expectNthOccurrenceIndex(wiringWorkflow, TIMELINE_GITHUB_PATH_FILTER_HEAD_BLOCK, 1)
      expectNthOccurrenceIndex(wiringWorkflow, TIMELINE_GITHUB_PATH_FILTER_HEAD_BLOCK, 2)
      for (const pathLine of TIMELINE_GITHUB_PATH_FILTER_GATE_RUNNER_LINES) {
        expectNthOccurrenceIndex(wiringWorkflow, pathLine, 1)
        expectNthOccurrenceIndex(wiringWorkflow, pathLine, 2)
      }
      expectNthOccurrenceIndex(wiringWorkflow, TIMELINE_GITHUB_PATH_FILTER_WORKFLOW_AUTOMATION_CLOSURE_SCRIPT_LINE, 1)
      expectNthOccurrenceIndex(wiringWorkflow, TIMELINE_GITHUB_PATH_FILTER_WORKFLOW_AUTOMATION_CLOSURE_SCRIPT_LINE, 2)
      for (const pathLine of TIMELINE_GITHUB_PATH_FILTER_REMAINING_CLOSURE_RUNNER_LINES) {
        expectNthOccurrenceIndex(wiringWorkflow, pathLine, 1)
        expectNthOccurrenceIndex(wiringWorkflow, pathLine, 2)
      }
    })

    it('pins package.json release:gate:timeline-contracts closure + spawn timeout snippets', () => {
      expect(wiringPackageJson).toContain(TIMELINE_RELEASE_GATE_SCRIPT_JSON_KEY)
      const timelineScriptMatch = wiringPackageJson.match(
        new RegExp(`"${TIMELINE_RELEASE_GATE_SCRIPT}":\\s*"([^"]+)"`)
      )
      expect(timelineScriptMatch).not.toBeNull()
      const timelineScriptValue = timelineScriptMatch![1] ?? ''
      for (const snippet of TIMELINE_RELEASE_GATE_SCRIPT_TIMEOUT_SNIPPETS) {
        expect(timelineScriptValue).toContain(snippet)
      }
    })

    it('pins package.json + jest.m0 timeline gate tooling references', () => {
      expect(wiringPackageJson).toContain(TIMELINE_WIRING_PACKAGE_GATE_SUITE_SCRIPT)
      expect(wiringPackageJson).toContain(TIMELINE_WIRING_PACKAGE_TEST_M0_JSON_KEY)
      expect(wiringPackageJson).toContain(TIMELINE_WIRING_JEST_M0_CONFIG_FILENAME)
      expect(wiringJestM0Config).toContain(TIMELINE_WIRING_JEST_M0_ROOTS_SNIPPET)
      expect(wiringJestM0Config).toContain(TIMELINE_WIRING_JEST_M0_FORCE_EXIT_SNIPPET)
    })

    it('pins release gate suite timeline orchestration comments + M0 gate ids', () => {
      expect(wiringGateSuite).toContain(RELEASE_GATE_SUITE_JEST_CONTRACT_HEADER_LINE)
      expect(wiringGateSuite).toContain(RELEASE_GATE_SUITE_WORKFLOW_AUTOMATION_PH312_COMMENT_LINE)
      for (const line of RELEASE_GATE_SUITE_TIMELINE_BUNDLE_CLOSURE_PH313_COMMENT_LINES) {
        expect(wiringGateSuite).toContain(line)
      }
      expect(wiringGateSuite).toContain(`id: '${TIMELINE_GATE_SUITE_ID_M0}'`)
      expect(wiringGateSuite).toContain(`id: '${TIMELINE_GATE_SUITE_ID_M0_DEEPLINK_CONTEXT_CONTRACTS}'`)
    })
  })

  // Workflow-automation closure runner path binding guards (split it() for clearer failure slices).
  describe(WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE, () => {
    let closureRunnerSource: string
    let contractSuiteSourceClosure: string

    beforeAll(() => {
      const root = process.cwd()
      closureRunnerSource = readFileSync(
        path.join(root, TIMELINE_WORKFLOW_AUTOMATION_CLOSURE_SCRIPT_RELPATH),
        'utf8'
      )
      contractSuiteSourceClosure = readFileSync(path.join(root, TIMELINE_CONTRACT_SUITE_RELPATH), 'utf8')
    })

    it('pins nested closure-runner describe constant + runner Jest pointer line', () => {
      expect(contractSuiteSourceClosure).toContain(
        'describe(WORKFLOW_AUTOMATION_CLOSURE_RUNNER_SOURCE_DESCRIBE_TITLE, () => {'
      )
      expect(closureRunnerSource).toContain(WORKFLOW_AUTOMATION_CLOSURE_RUNNER_JEST_CONTRACT_HEADER_LINE)
    })

    it('pins canonical array name, spread into tests, and spread adjacency', () => {
      expect(closureRunnerSource).toContain('const WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS = [')
      expect(closureRunnerSource).toContain('const tests = [...WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS]')
      expect(closureRunnerSource).toContain(']\n\nconst tests = [...WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS]')
    })

    it('pins startup membership loop, length guard, and duplicate-path error string', () => {
      expect(closureRunnerSource).toContain('for (const p of WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS) {')
      expect(closureRunnerSource).toContain('if (!tests.includes(p))')
      expect(closureRunnerSource).toContain('if (tests.length !== WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS.length)')
      expect(closureRunnerSource).toContain('[workflow-automation-closure] tests[] must not contain duplicate paths.')
    })

    it('pins M0 binding, single path literal, and array tail uses constant not quoted path', () => {
      expect(closureRunnerSource).toContain(WORKFLOW_AUTOMATION_CLOSURE_RUNNER_M0_TIMELINE_PH311_COMMENT_LINE)

      const m0Match = closureRunnerSource.match(
        /const M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST\s*=\s*\r?\n\s*'([^']+)'/
      )
      expect(m0Match).not.toBeNull()
      expect(m0Match![1]).toBe(TIMELINE_CONTRACT_SUITE_RELPATH)

      const pathLiteral = `'${TIMELINE_CONTRACT_SUITE_RELPATH}'`
      expect(closureRunnerSource.split(pathLiteral).length - 1).toBe(1)

      expect(closureRunnerSource).toMatch(/\bM0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST\s*,\s*\]/)
      const pathLiteralEscapedForRegex = pathLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      expect(closureRunnerSource).not.toMatch(new RegExp(`${pathLiteralEscapedForRegex}\\s*,\\s*\\]`))
    })

    it('pins approval path literals once each in ascending order before M0 array tail', () => {
      const m0TailMarker = '  M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST,\n]'
      const m0TailIdx = closureRunnerSource.indexOf(m0TailMarker)
      expect(m0TailIdx).toBeGreaterThan(-1)
      let prevApprovalIdx = -1
      for (const p of WORKFLOW_AUTOMATION_CLOSURE_APPROVAL_TEST_PATHS) {
        const literal = `'${p}'`
        expect(closureRunnerSource.split(literal).length - 1).toBe(1)
        const idx = closureRunnerSource.indexOf(literal)
        expect(idx).toBeGreaterThan(prevApprovalIdx)
        expect(idx).toBeLessThan(m0TailIdx)
        prevApprovalIdx = idx
      }
    })
  })

  // Timeline gate-list and warn-only scope guards.
  it(`keeps timeline ${TIMELINE_RELEASE_GATES_ENV} and ${TIMELINE_RELEASE_GATE_WARN_ONLY_ENV} pinned`, () => {
    const { packageJson } = readRepoFiles()
    expectTimelineReleaseGateContracts(packageJson)
  })
})
