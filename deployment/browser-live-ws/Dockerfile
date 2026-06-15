# Browser live voice WSS sidecar (M1) — always-on host, not Vercel serverless.
# Build from repo root: docker build -f deployment/browser-live-ws/Dockerfile -t payaid-browser-live-ws .
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY scripts/prisma-generate-with-retry.js scripts/
COPY packages/db packages/db
COPY prisma prisma
COPY tsconfig.json ./

RUN npm ci && node scripts/prisma-generate-with-retry.js

COPY lib lib
COPY server server

ENV NODE_ENV=production
ENV PAYAID_CLI_SCRIPT=1
ENV HOST=0.0.0.0
EXPOSE 3002 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT:-10000}/health" || exit 1'

CMD ["npx", "tsx", "server/browser-live-voice-ws.ts"]
