# Mini ATS — Applicant Tracking System (MERN)

Manage candidates through hiring stages, search and filter them, run a drag-and-drop pipeline, and track hiring metrics on a dashboard.

**Stack:** MongoDB · Express · React 18 (Vite) · Node.js

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/himanshu-gupta15/mini-ats)

## Quick start

```bash
npm run install:all   # installs root, server and client deps
npm run dev           # API on :5001, client on http://localhost:5173
```

No MongoDB? No problem — if `MONGO_URI` is not set, the server starts an **in-memory MongoDB** and auto-seeds 60 sample candidates (data resets on restart).

To use a real database:

```bash
cp server/.env.example server/.env   # set MONGO_URI (local or Atlas)
npm run seed                         # optional: load 60 sample candidates (wipes the collection)
npm run dev
```

Production: `npm run build && npm start` — Express serves the built client from `client/dist`.

## Features

| Area | What you get |
|---|---|
| **Candidates** | Create / edit / delete, validation (client + server), unique email, skills, source, experience, 0–5 rating, resume link |
| **Hiring stages** | Applied → Screening → Interview → Offer → Hired, plus Rejected. Every move is recorded in a stage history timeline |
| **Search & filters** | Debounced full search (name, email, position, skills, location), filter by stage / source / skill / min experience / position, 5 sort orders, pagination; filters live in the URL so views are shareable |
| **Pipeline board** | Kanban with drag-and-drop between stages (optimistic, rolls back on error) and a keyboard-accessible "Move…" menu |
| **Candidate profile** | Stage stepper, inline rating, notes (add/delete), stage history |
| **Dashboard** | Totals, active, hired, hire rate, offer acceptance, avg time-to-hire, stage breakdown, conversion funnel, weekly applications, sources, top positions |

## API

Base URL: `/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/candidates` | List. Query: `search`, `stage` (comma list), `source`, `position`, `skill` (comma list, all must match), `minExp`, `sort` (`newest`\|`oldest`\|`name`\|`rating`\|`experience`), `page`, `limit` (≤100) |
| GET | `/candidates/meta` | Allowed stages and sources |
| GET | `/candidates/:id` | Full candidate incl. notes & stage history |
| POST | `/candidates` | Create |
| PUT | `/candidates/:id` | Update profile fields |
| PATCH | `/candidates/:id/stage` | `{ "stage": "Interview" }` — appends to stage history |
| POST | `/candidates/:id/notes` | `{ "text": "..." }` |
| DELETE | `/candidates/:id/notes/:noteId` | Remove a note |
| DELETE | `/candidates/:id` | Delete candidate |
| GET | `/dashboard/metrics?weeks=8` | Aggregated metrics (single `$facet` aggregation) |

Errors return `{ message, errors? }` with 400 (validation), 404, 409 (duplicate email).

## Project structure

```
server/src
  index.js            boot: DB connect, auto-seed in-memory, listen
  app.js              express app, routes, static client
  db.js               Mongo / in-memory connection
  models/Candidate.js schema, stages, indexes
  routes/candidates.js CRUD, search, stage, notes
  routes/dashboard.js metrics aggregation
  seedData.js, seed.js sample data
client/src
  pages/              Dashboard, Candidates, Pipeline, CandidateDetail
  components/         CandidateForm, Modal, Toast, BarList, WeeklyChart, Rating, StageBadge
  api/client.js       fetch wrapper
```

## Deploy (Render + MongoDB Atlas)

1. **Atlas:** create a free M0 cluster → *Database Access*: add a user → *Network Access*: allow `0.0.0.0/0` (Render has no static IPs on the free plan) → *Connect → Drivers*: copy the URI and add a DB name, e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/mini-ats`.
2. **Render:** *New → Blueprint* → pick this repo. `render.yaml` configures the build (`npm run render-build`), start command and health check. Paste the Atlas URI when asked for `MONGO_URI`.
3. **Optional sample data:** from your machine, `MONGO_URI="<atlas uri>" npm run seed` (wipes the candidates collection first).

In production the server requires `MONGO_URI` and serves the React build and the API from a single service.
