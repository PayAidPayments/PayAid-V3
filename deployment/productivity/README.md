# PayAid Productivity – Deployment

**PayAid Sheets** uses the built-in spreadsheet editor (x-spreadsheet) in the app. No external document server is required.

- **PayAid Meet**: Deploy Jitsi separately (e.g. [jitsi/docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet)). Set `NEXT_PUBLIC_MEET_BASE_URL` in PayAid `.env`.
- **PayAid Drive**: Set `DRIVE_SERVER_URL` in PayAid `.env` if you use an external file server.
