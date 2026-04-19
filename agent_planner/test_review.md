# Test Review

Scope: `tests/blackbox-smoke.js`, `tests/whitebox-content.js`, and `package.json` test scripts.

## Result

No blocking test breakage found. The smoke now also checks the note payload contract that Study normalizes at render time.

## Improvement

### Low
- **File:** `tests/blackbox-smoke.js`
- **Change:** Added a live check for `GET /api/notes/it_biztonsag/01-00-introitsec-bme-2026-hu` so the study render path is covered by smoke testing, not just glossary/search pages.
- **Benefit:** This gives a quick guard on the note payload shape that feeds `normalizeNotePayload()` in `src/screens/Study.jsx`.

## Verification

- `node tests/whitebox-content.js` passed.
- `node tests/blackbox-smoke.js --base-url http://127.0.0.1:3000` passed.
- `npm.cmd run test:smoke` passed.
- `npm.cmd run lint` passed.
