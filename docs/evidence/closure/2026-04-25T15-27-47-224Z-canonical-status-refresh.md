# Canonical status refresh

- Timestamp: 2026-04-25T15:27:47.224Z
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-25T15-27-47-224Z-canonical-status-refresh.json`

## Step results

- FAIL closeout-status-snapshot (`npm run run:canonical-closeout-status-snapshot`, 420322ms, timeout=420000ms, timed out)
- FAIL live-status-sync (`npm run sync:canonical-live-status`, 38774ms, timeout=120000ms)
- PASS closeout-next-actions (`npm run show:canonical-closeout-next-actions`, 39423ms, timeout=120000ms)

## Raw payload

```json
{
  "check": "canonical-status-refresh",
  "timestamp": "2026-04-25T15:27:47.224Z",
  "overallOk": false,
  "totalSteps": 3,
  "completedSteps": 3,
  "results": [
    {
      "id": "closeout-status-snapshot",
      "command": "npm run run:canonical-closeout-status-snapshot",
      "timeoutMs": 420000,
      "elapsedMs": 420322,
      "exitCode": 1,
      "timedOut": true,
      "expectedExit": true,
      "ok": false,
      "outputTail": [
        "",
        "> payaid-v3@0.1.0 run:canonical-closeout-status-snapshot",
        "> node scripts/run-canonical-closeout-status-snapshot.mjs",
        "",
        "",
        ""
      ]
    },
    {
      "id": "live-status-sync",
      "command": "npm run sync:canonical-live-status",
      "timeoutMs": 120000,
      "elapsedMs": 38774,
      "exitCode": 2147483651,
      "timedOut": false,
      "expectedExit": false,
      "ok": false,
      "outputTail": [
        "",
        "> payaid-v3@0.1.0 sync:canonical-live-status",
        "> node scripts/sync-canonical-live-status-block.mjs",
        "",
        "",
        "\r",
        "\r",
        "#\r",
        "# Fatal process out of memory: Re-embedded builtins: set permissions\r",
        "#\r",
        "----- Native stack trace -----\r",
        "\r",
        " 1: 00007FF64EA318E7 node::SetCppgcReference+18263\r",
        " 2: 00007FF64E9020FF node::TriggerNodeReport+71583\r",
        " 3: 00007FF64FC01016 v8::base::FatalOOM+54\r",
        " 4: 00007FF64F59AEA3 v8::Isolate::ReportExternalAllocationLimitReached+147\r",
        " 5: 00007FF64F587916 v8::Function::Experimental_IsNopFunction+3302\r",
        " 6: 00007FF64F430E5A v8::CppHeap::wrapper_descriptor+55594\r",
        " 7: 00007FF64F457F6A v8::base::CPU::has_sse41+82026\r",
        " 8: 00007FF64F455F4F v8::base::CPU::has_sse41+73807\r",
        " 9: 00007FF64F088FF3 v8::base::AddressSpaceReservation::AddressSpaceReservation+12051\r",
        "10: 00007FF64F590A41 v8::Isolate::Initialize+433\r",
        "11: 00007FF64EA7098D node::NewContext+397\r",
        "12: 00007FF64E93411B v8_inspector::protocol::Binary::operator=+128891\r",
        "13: 00007FF64E9DCF99 node::Start+4873\r",
        "14: 00007FF64E9DBCAE node::Start+30\r",
        "15: 00007FF64E73B01C AES_cbc_encrypt+151564\r",
        "16: 00007FF6502F5E1C inflateValidate+40748\r",
        "17: 00007FF9F591E8D7 BaseThreadInitThunk+23\r",
        "18: 00007FF9F6BAC3FC RtlUserThreadStart+44\r",
        ""
      ]
    },
    {
      "id": "closeout-next-actions",
      "command": "npm run show:canonical-closeout-next-actions",
      "timeoutMs": 120000,
      "elapsedMs": 39423,
      "exitCode": 0,
      "timedOut": false,
      "expectedExit": true,
      "ok": true,
      "outputTail": [
        "",
        "> payaid-v3@0.1.0 show:canonical-closeout-next-actions",
        "> node scripts/show-canonical-closeout-next-actions.mjs",
        "",
        "{",
        "  \"ok\": true,",
        "  \"latestSnapshot\": \"docs/evidence/closure/2026-04-25T15-28-00-124Z-canonical-closeout-status-snapshot.json\",",
        "  \"latestMonitoringCheck\": \"docs/evidence/closure/2026-04-25T15-29-28-000Z-canonical-monitoring-complete-check.json\",",
        "  \"monitoringComplete\": false,",
        "  \"nextCheckpoint\": {",
        "    \"label\": \"tplus8\",",
        "    \"hours\": 8,",
        "    \"eligibleAtUtc\": \"2026-04-25T16:00:00.000Z\",",
        "    \"dueNow\": false,",
        "    \"remainingMinutes\": 32",
        "  },",
        "  \"nextAction\": {",
        "    \"type\": \"wait_until_due\",",
        "    \"message\": \"Wait for tplus8 eligibility at 2026-04-25T16:00:00.000Z, then run checkpoint alias.\",",
        "    \"commands\": [",
        "      \"npm run run:canonical-monitor:tplus8\"",
        "    ]",
        "  },",
        "  \"finalizeCommands\": [",
        "    \"npm run check:canonical-monitoring-complete\",",
        "    \"npm run check:canonical-module-api-readiness-verdict:stable\",",
        "    \"npm run run:canonical-closeout-status-snapshot\"",
        "  ]",
        "}",
        "",
        ""
      ]
    }
  ]
}
```
