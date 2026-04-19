# Tests

This folder contains two dependency-free Node checks:

- `blackbox-smoke.js` probes the live dev server.
- `whitebox-content.js` checks the generated content shape and helper contracts directly from the repo files.

## Run

```bash
node tests/whitebox-content.js
node tests/blackbox-smoke.js
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
```

## What the smoke test covers

- `GET /api/health`
- `GET /api/search`
- `POST /api/validate-answer` with an empty payload
- `GET /`
- `GET /subject/it_biztonsag`
- `GET /study/it_biztonsag`
- `GET /search/it_biztonsag`
- `GET /onboarding`
- `GET /glossary/it_biztonsag`
