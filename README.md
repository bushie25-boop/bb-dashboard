# bb-dashboard

**B&B Agrisales — Local Dashboard**

A standalone dark-theme dashboard app running on Lee's Mac Studio. Displays real-time status of all B&B AI agents in a pixel-art office layout.

## What this is

- **Not part of AgriChem** — this is a separate local-only app
- Designed to stay open on a monitor all day
- Dark theme, full-screen, pixel-art vibes
- Shows live agent status pulled from OpenClaw cron data
- More panels coming: AgriChem stats, cron activity, weather, grain prices

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Backend:** Express (local API server)
- **Port:** Vite dev → 4000 | API server → 4001

## How to run

```bash
npm run dashboard
```

This starts both the Vite dev server (port 4000) and the Express API server (port 4001) concurrently.

## How to open

[http://localhost:4000](http://localhost:4000)

## Pages

| Route     | Description                         |
|-----------|-------------------------------------|
| `/office` | Pixel-art B&B AI Team HQ (HOME)     |

More pages will be added here as panels are built.

## Adding new panels

1. Create `src/pages/YourPage.tsx`
2. Add a `<Route path="/your-page" element={<YourPage />} />` in `src/App.tsx`
3. Add an API endpoint in `server/index.ts` if needed
4. Done.

## API Endpoints

| Endpoint            | Description                                          |
|---------------------|------------------------------------------------------|
| `GET /api/agent-status` | Agent working/idle/offline status from cron runs |
| `GET /api/system`   | System info + OpenClaw gateway status                |
| `GET /api/health`   | Health check                                         |
