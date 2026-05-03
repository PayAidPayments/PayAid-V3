# Mobile Release Runbook

## Tracks

- iOS TestFlight
- Android Play Beta
- Real-device performance validation

## iOS TestFlight checklist

1. Build signed release archive.
2. Upload to App Store Connect.
3. Complete test notes/changelog.
4. Assign internal/external tester groups.
5. Capture build id + rollout status.

## Android Play Beta checklist

1. Build signed AAB.
2. Upload to Play Console internal/beta track.
3. Define rollout percentage.
4. Publish release notes.
5. Capture release id + rollout status.

## Performance pass (real devices)

Minimum captures per platform:

- App launch cold/warm time
- Time to interactive for 3 core flows
- Crash-free session rate over pilot window

## Artifact location

- `docs/evidence/mobile/<YYYY-MM-DD>-mobile-release.json`

