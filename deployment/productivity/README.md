# PayAid Productivity – Deployment (Office + Meet)

Run **ONLYOFFICE Document Server** and **Jitsi** for PayAid Sheets, Docs, Slides, Drive, and Meet. Set env vars in your main app (PayAid V3) to point here.

## Quick start

```bash
cd deployment/productivity
cp .env.example .env
# Edit .env: set JWT_SECRET to match PayAid V3 JWT_SECRET if you need token validation on these services
docker compose up -d
```

- **Document Server:** http://localhost:8080 (or set `OFFICE_SERVER_URL` in PayAid to your host, e.g. https://office.payaid.app)
- **Jitsi:** http://localhost:8443 (or set `NEXT_PUBLIC_MEET_BASE_URL`, e.g. https://meet.payaid.app)

## PayAid V3 env (in main app)

```env
OFFICE_SERVER_URL=https://office.payaid.app
DRIVE_SERVER_URL=https://office.payaid.app/files
NEXT_PUBLIC_MEET_BASE_URL=https://meet.payaid.app
```

## White-labeling

- **ONLYOFFICE:** In Document Server config, set product name / branding to "PayAid". Use `/productivity-white-label.css` from PayAid app if you inject a wrapper.
- **Jitsi:** In `.env` set `APP_NAME=PayAid Meet`, and in config remove Jitsi watermark.

## Jitsi (PayAid Meet)

Run Jitsi separately (different stack). Recommended:

1. Clone [jitsi/docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet), copy `env.example` to `.env`.
2. Set in `.env`: `PUBLIC_URL=https://meet.payaid.app`, `APP_NAME=PayAid Meet`, and your domain. Open UDP 10000 for JVB.
3. `docker compose up -d`. Set `NEXT_PUBLIC_MEET_BASE_URL` in PayAid V3 to your Meet URL.

## Production

- Use HTTPS and a reverse proxy (e.g. Nginx/Caddy) in front of Docker.
- Point DNS: `office.payaid.app` → Document Server, `meet.payaid.app` → Jitsi.
- Ensure JWT_SECRET (if used by Document Server for WOPI) matches PayAid.
