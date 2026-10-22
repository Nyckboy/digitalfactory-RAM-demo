# Digital Factory - Portfolio Demo

A browser-only, interactive companion to the [full application](https://github.com/Nyckboy/digitalfactory-RAM). This standalone repository is intended to remain private; the built site can be public.

## Try it locally

Requires Node.js 22.18+ (for the TypeScript test runner), or a newer supported Node release, and pnpm.

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm test
pnpm dev
```

Choose Admin, Supervisor, or Intern on the entry screen. All people, projects, tasks, and notifications are fictional. Switch roles with the persistent demo controls. Changes persist within the browser tab using session storage, with an in-memory fallback if storage is unavailable. Reset restores the seed data. Do not enter real personal information.

## What works

- Admin: browse and manage sample users/projects, dashboard statistics, activity, and simulated AI drafts.
- Supervisor: view projects and team members, create/edit/delete tasks, review submissions, and add comments.
- Intern: view assigned tasks, update progress, attach a deliverable URL, and discuss work.
- Notifications: local events and read/unread state.
- Role switching and reset without registration or real JWTs.

The three built-in personas cannot be edited or deleted, so navigation between roles remains available. Other user records can be edited or removed when unassigned. Demo data is capped to keep the session small.

AI drafts are deterministic local examples, not calls to a model. Deliverables are links, not file uploads. There is no email delivery or real account creation.

## Isolation from the full app

The frontend Axios client has only a custom in-memory adapter. It does not read API endpoint environment variables, fall back to HTTP, or open WebSocket connections. Unsupported API operations fail locally. Authentication stores only a selected demo role, using separate storage keys. Passwords entered in sample user forms are discarded.

The Nginx configuration serves static files and has no API proxy. Application data never leaves the browser through the demo API. Existing visual assets may still load from external image/font services; source-code and deliverable links navigate to external sites.

The backend source remains in this repository's inherited history/current tree for reference, but the demo does not build, run, or deploy it. No local application configuration, .env files, Maven outputs, or production credentials were copied. Production deployment commands have been removed from the demo Jenkinsfile.

## Build and host

```sh
cd frontend
pnpm test
pnpm build
```

Publish `frontend/dist` using a static host. Configure an SPA fallback to `index.html` for deep links; a Netlify-style `_redirects` file is included. No API credentials or backend service are required. The included Docker Compose setup builds and hosts the frontend container; see [the VPS deployment guide](docs/vps-deployment.md).

No public site has been deployed yet.

## Optional Jenkins job

Create a **separate** job for this repository. The pipeline defaults to `BUILD` and archives the static build. Configure a NodeJS tool named `Node22` providing Node 22.18+ and pnpm.

Select `DEPLOY` to test the demo and run `docker compose up -d --build`, creating or replacing only the `digitalfactory-demo` container on that agent's Docker host. It listens on localhost port 3003 by default (configure `DIGITALFACTORY_PORT` with the job environment if needed), ready for a host Nginx reverse proxy. `START` and `STOP` control that already-provisioned container. They never target the full app's `backend` or `frontend` containers. If the job uses several agents, pin it to the one running the demo container.

The Start/Stop helper is restricted to the `digitalfactory-demo` container and is used only by this separate demo pipeline.

## Verification

`pnpm test` exercises the simulated workflow, role scoping, safe rejection of unsupported requests, notifications, reset seed independence, and password omission. `pnpm build` checks TypeScript and creates the static bundle.

The demo is intentionally separate from production. Local test coverage does not substitute for reviewing the visitor experience in a browser before publishing.
