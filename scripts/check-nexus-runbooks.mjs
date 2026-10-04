#!/usr/bin/env node
/**
 * Validates PayAid internal NEXUS Phase 1 catalog integrity:
 * - divisions.json divisions are non-empty
 * - every agent division exists
 * - every runbook agent slug exists
 * - every runbook doc path exists
 * - shipBlockedWithout slugs exist
 * - requiredSkills (if any) exist under docs/ai/agents/<skill>/SKILL.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const nexusDir = path.join(root, 'docs', 'ai', 'nexus')

function readJson(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required file: ${rel}`)
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'))
}

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

function main() {
  const divisions = readJson('docs/ai/nexus/divisions.json')
  const agentsDoc = readJson('docs/ai/nexus/agents.json')
  const runbooksDoc = readJson('docs/ai/nexus/runbooks.json')

  const divisionKeys = Object.keys(divisions.divisions || {})
  if (divisionKeys.length === 0) fail('divisions.json has no divisions')

  const agents = agentsDoc.agents || []
  if (agents.length === 0) fail('agents.json has no agents')

  const agentSlugs = new Set()
  for (const agent of agents) {
    if (!agent.slug) {
      fail('agent missing slug')
      continue
    }
    if (agentSlugs.has(agent.slug)) fail(`duplicate agent slug: ${agent.slug}`)
    agentSlugs.add(agent.slug)
    if (!divisionKeys.includes(agent.division)) {
      fail(`agent ${agent.slug} has unknown division: ${agent.division}`)
    }
    for (const skill of agent.skills || []) {
      const skillPath = path.join(root, 'docs', 'ai', 'agents', skill, 'SKILL.md')
      if (!fs.existsSync(skillPath)) {
        fail(`agent ${agent.slug} references missing skill: ${skill}`)
      }
    }
  }

  const requiredFiles = [
    'docs/ai/nexus/README.md',
    'docs/ai/nexus/handoff-templates.md',
    'docs/ai/nexus/ship-gate.md',
  ]
  for (const rel of requiredFiles) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  }

  const runbooks = runbooksDoc.runbooks || []
  if (runbooks.length < 5) fail(`expected at least 5 runbooks, found ${runbooks.length}`)

  const runbookSlugs = new Set()
  for (const rb of runbooks) {
    if (!rb.slug) {
      fail('runbook missing slug')
      continue
    }
    if (runbookSlugs.has(rb.slug)) fail(`duplicate runbook slug: ${rb.slug}`)
    runbookSlugs.add(rb.slug)

    if (!rb.doc) {
      fail(`runbook ${rb.slug} missing doc`)
    } else if (!fs.existsSync(path.join(root, rb.doc))) {
      fail(`runbook ${rb.slug} doc missing: ${rb.doc}`)
    }

    const blocked = rb.shipBlockedWithout || []
    if (blocked.length === 0) fail(`runbook ${rb.slug} missing shipBlockedWithout`)
    for (const slug of blocked) {
      if (!agentSlugs.has(slug)) fail(`runbook ${rb.slug} shipBlockedWithout unknown agent: ${slug}`)
    }

    for (const skill of rb.requiredSkills || []) {
      const skillPath = path.join(root, 'docs', 'ai', 'agents', skill, 'SKILL.md')
      if (!fs.existsSync(skillPath)) {
        fail(`runbook ${rb.slug} requiredSkills missing: ${skill}`)
      }
    }

    const roster = rb.roster || []
    if (roster.length === 0) fail(`runbook ${rb.slug} has empty roster`)
    for (const group of roster) {
      for (const slug of group.agents || []) {
        if (!agentSlugs.has(slug)) {
          fail(`runbook ${rb.slug} roster unknown agent: ${slug}`)
        }
      }
    }
  }

  const expected = [
    'new-page-or-route',
    'schema-or-billing-change',
    'performance-pass',
    'release',
    'production-incident',
  ]
  for (const slug of expected) {
    if (!runbookSlugs.has(slug)) fail(`missing required runbook: ${slug}`)
  }

  if (process.exitCode) {
    console.error('NEXUS runbook check FAILED')
    process.exit(process.exitCode)
  }

  console.log(
    `NEXUS runbook check PASS (${divisionKeys.length} divisions, ${agentSlugs.size} agents, ${runbookSlugs.size} runbooks)`
  )
  console.log(`Catalog root: ${path.relative(root, nexusDir)}`)
}

main()
