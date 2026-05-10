# Tests

This folder contains dependency-light checks for frontend/backend readiness:

- `run-unit.js` runs every `tests/unit/*.test.js` file.
- `blackbox-smoke.js` probes the live dev server.
- `blackbox-api-contract.js` checks the live API response contracts in more detail.
- `whitebox-content.js` checks the generated content shape and helper contracts directly from the repo files.
- `whitebox-plan-contract.js` checks `plan.json`, `quality-report.json`, and source manifests.
- `backend-pipeline-smoke.js` checks local backend generators and chunking metadata.
- `backend-pipeline-whitebox.py` checks the Python ingest/model contracts.

## Run

```bash
node tests/run-unit.js
node tests/whitebox-content.js
node tests/whitebox-plan-contract.js
node tests/blackbox-smoke.js
node tests/blackbox-api-contract.js
npm run test:pipeline
```

If the dev server is running on something other than `http://127.0.0.1:3000`, pass the URL explicitly:

```bash
node tests/blackbox-smoke.js --base-url http://127.0.0.1:3000
```

## npm scripts

```bash
npm run test:whitebox
npm run test:blackbox
npm run test:smoke
npm run test:pipeline
npm run test:all
```

`test:blackbox` and `test:smoke` require a running app at `http://127.0.0.1:3000` unless `BACKEND_BASE_URL` or `--base-url` is provided.

## What the smoke test covers

- `GET /api/health`
- `GET /api/search`
- `GET /api/subjects`
- `GET /api/questions/:slug`
- `GET /api/flashcards/:slug`
- `GET /api/glossary/:slug`
- `GET /api/notes/:slug`
- `GET /api/notes/:slug/:lesson`
- `POST /api/validate-answer` with an empty payload
- `POST /api/validate-answer` with an oversized payload
- `POST /api/validate-answer` with a valid sample payload
- `GET /`
- `GET /subject/it_biztonsag`
- `GET /study/it_biztonsag`
- `GET /search/it_biztonsag`
- `GET /onboarding`
- `GET /glossary/it_biztonsag`
