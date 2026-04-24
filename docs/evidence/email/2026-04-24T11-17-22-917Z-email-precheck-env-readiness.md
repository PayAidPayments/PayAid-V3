# Email Precheck Env Readiness

- Timestamp: 2026-04-24T11:17:22.917Z
- NODE_ENV: development
- Working directory: D:\Cursor Projects\PayAid V3
- Ready for precheck command: no

## Variable checks

- DATABASE_URL present: yes
- DATABASE_URL endpoint preview: aws-1-ap-northeast-1.pooler.supabase.com:5432
- REDIS_URL present: no
- REDIS_URL endpoint preview: [missing]
- UPSTASH_REDIS_REST_URL present: yes
- UPSTASH_REDIS_REST_URL endpoint preview: beloved-gull-95753.upstash.io:6379
- UPSTASH_REDIS_REST_TOKEN present: yes

## Note

- Upstash REST appears configured, but Bull/worker precheck requires TCP `REDIS_URL`.

## Raw JSON

```json
{
  "timestamp": "2026-04-24T11:17:22.917Z",
  "nodeEnv": "development",
  "shellCwd": "D:\\Cursor Projects\\PayAid V3",
  "checks": {
    "DATABASE_URL": {
      "present": true,
      "preview": "aws-1-ap-northeast-1.pooler.supabase.com:5432"
    },
    "REDIS_URL": {
      "present": false,
      "preview": "[missing]"
    },
    "UPSTASH_REDIS_REST_URL": {
      "present": true,
      "preview": "beloved-gull-95753.upstash.io:6379"
    },
    "UPSTASH_REDIS_REST_TOKEN": {
      "present": true,
      "preview": "[set len=71]"
    }
  },
  "readyForPrecheck": false
}
```
