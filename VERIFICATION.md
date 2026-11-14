# Verification

Root launcher fix: added a dependency-free package.json forwarding npm commands to frontend. Verified `npm run dev -- -- --help` from the application root reaches the installed Vite dev command successfully (exit 0). This checks forwarding without starting another server. README and both build prompts now document running npm run dev from the root; the Python backend still needs its own terminal.

Verified on Windows with Python 3.14.5, Node.js 24.22.2 and npm 11.19.1, 8 November 2026.

## Automated checks

- **27 backend tests passed.** Real FastAPI/Pydantic/native SSE were exercised with only the SDK query boundary replaced. Tests use actual SDK dataclasses and verify locked-down options, both prompt routes, safe schemas, body/content-type/JSON/origin validation, chunked body limits, safe projections, result/error subtypes, missing key/result, SSE ordering, no done on failure, iterator closure and cancellation/disconnect.
- **16 frontend tests passed** in 2 files. Vue Test Utils, real Vue Router and jsdom cover clicks across every section, active navigation, repeated visits, all 16 architecture cards, preserved lab prompt, actual production hash history, skip-link routing, Stream/Simple, trim and keyboard submission, duplicate/busy controls, errors/retry, error-result handling, theme/key status, unmount abort and sanitization. Fetch tests cover UTF-8 split across single bytes, CRLF/comments, safe HTTP detail/status fallbacks, required final/done and runtime result validation.
- `npm run build` passed with the actual Vue plugin and production bundle. Public images remain browser URLs in the template, avoiding invalid file imports in Windows tests.
- `pip check` reported no broken requirements. Exact direct Python packages and the full verified Windows environment are recorded separately. npm direct versions match the pinned manifest/lockfile.
- Lesson generation is deterministic on rerun. The generated SVG parses as XML, has five lifelines and contains 16 numbered interactions matching the 16 generated source cards. Missing source markers/labels fail explicitly.
- The new standalone prompt and BUILD-PROMPT.txt are byte-identical.

The first sandboxed Python test attempt could not access pytest's Windows temporary directories. Running the same tests with filesystem access completed successfully; this was not a test assertion failure. Tests use mocked credentials and require no API credits.

## Actual HTTP checks

Started backend/run.py on port 8100 after the Vue production build, plus Vite on 4600. Checked both addresses:

| Request | Outcome |
| --- | --- |
| GET / | 200; Vue SPA shell (not server-rendered lesson content) |
| CSS and JavaScript linked from each shell | 200 |
| GET /docs and /openapi.json | 200 |
| GET /api/health | 200; api_key_configured=false |
| GET /workflow.svg, /workflow.puml and /astronaut.png | 200 |
| Matching-origin POST with empty prompt, both endpoints | 422; origin accepted before input rejection |
| Foreign-origin POST, both endpoints | 403 |
| Valid query without configured key | 503 with setup instruction |
| Valid stream without configured key | 200 SSE error; no done |

An additional request explicitly sent Host: localhost:4600 and Origin: http://localhost:4600 through Vite to FastAPI; it passed origin validation and returned expected 422 for its empty prompt. This checks host preservation through the actual proxy. An unknown API URL on the built backend returned 404, not the Vue shell.

Temporary servers were stopped after verification. Use README.md to start your own development or built-app instance.

## Scope and limits

No environment files or credentials were copied from earlier editions. This new application's key is unconfigured, so **no real Claude response was tested**. SDK options, message projection, failures and cleanup were exercised with the real SDK's types and a mocked query iterator. Health key presence does not verify provider authentication or available credit.

No interactive browser automation or screenshot review was available. Navigation and UI behavior were exercised in jsdom, while real HTTP checks verified both run modes and their assets/API. This does not replace a manual browser check of appearance, viewport behavior, clipboard/download behavior or a real provider-backed run.
