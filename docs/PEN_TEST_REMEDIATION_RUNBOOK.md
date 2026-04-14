# Penetration Test Remediation Runbook

## Scope

External penetration test execution is out-of-repo, but remediation workflow is defined here so findings can be tracked to closure.

## Steps

1. Obtain external report package (`pdf + raw findings`).
2. Convert findings to engineering issues (`severity`, `asset`, `endpoint`, `proof`).
3. Map each finding to:
   - code owner,
   - target fix release,
   - verification evidence path.
4. Implement fixes and link commits/PRs.
5. Add regression tests for every exploitable defect.
6. Archive retest result with status:
   - `fixed`,
   - `accepted risk`,
   - `not reproducible`.

## Artifact location

- `docs/evidence/security/<YYYY-MM-DD>-pentest-remediation.json`

## Required fields

- `report_id`
- `finding_id`
- `severity`
- `status`
- `owner`
- `fix_pr_or_commit`
- `verification_notes`
- `retest_outcome`

