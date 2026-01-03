# SWIPEYY OSINT Dashboard

A minimal React + Vite dashboard that simulates an OSINT-style reconnaissance workflow without touching private data. The UI demonstrates realistic request states, log streaming, target profile rendering, and stack health/allowlist visibility while explicitly refusing to bypass encrypted Snapchat "My Eyes Only" content or other private data.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed localhost URL to access the dashboard.

## How it works

- **Stateful pipeline:** IDLE → CONNECTING → FETCHING_HEADERS → PARSING_JSON → COMPLETE/ERROR.
- **Structured target model:** Defined in `src/types.ts` and materialized during the simulated request.
- **Stack visibility:** Cards surface FastAPI, Celery, Qdrant, MinIO, and PostgreSQL health to mirror the SWIPEYY backend scaffold.
- **Guardrails + connectors:** An allowlisted connector panel (Wikimedia Commons, iNaturalist, secure uploads) keeps the focus on compliant sources and flags custom crawlers for review.
- **Terminal-style logging:** Each phase appends time-stamped entries to the right-hand console.
- **Recon presets + metrics:** Quick buttons seed realistic usernames while metric chips summarize allowed connectors, queued jobs, and detected encrypted containers.
- **Security-first messaging:** The UI makes clear that encrypted containers remain inaccessible without proper keys.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and create a production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint checks
