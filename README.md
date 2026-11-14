# The Smallest Agent · Vue 3 + FastAPI + Python

A separate edition of the same course application using **Vue 3 Composition API, Vue Router, Vite, FastAPI, Pydantic and the Python Claude Agent SDK**. It retains the large fonts, light pastel cards, dark theme, five teaching sections, highlighted snippets and 16-step UML workflow.

The genuine Agent SDK loop stays recognizable: `query()` → `async for` → `ResultMessage`. Tools are disabled for this lesson. The new application never reads or copies another edition's credentials.

## Install in Windows Terminal / PowerShell

Tested with Python 3.14.5, Node.js 24.22.2 and npm 11.19.1. Start from the Lesson 0 workspace:

```powershell
cd .\05-smallest-agent-vue-fastapi
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd frontend
npm ci
cd ..
```

The environment is already created in this workspace. The installation commands above also work on a new checkout. Interpreter paths avoid PowerShell activation-policy issues.

## Configure this backend

From `05-smallest-agent-vue-fastapi`:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
notepad backend/.env
```

```dotenv
ANTHROPIC_API_KEY=your_actual_api_key
CLAUDE_MODEL=
AGENT_SYSTEM_PROMPT=
AGENT_MAX_TURNS=1
```

Replace the key placeholder. Blank model/system-prompt values use SDK defaults; optionally select a model available to your account. `AGENT_MAX_TURNS` accepts 1–10. Pydantic reads this project's `backend/.env` using an absolute path, independent of the terminal directory. Process environment variables override file values. Restart FastAPI after changes.

Keep keys on the backend. Do not put them in frontend files, `VITE_` variables, Git, screenshots or prompts. Health reveals key presence only, not authentication or available credit. The ignored real `.env` is not created automatically or borrowed from another app.

## Start development: two terminals

**Terminal 1**, from Lesson 0:

```powershell
cd .\05-smallest-agent-vue-fastapi
.\.venv\Scripts\python.exe backend/run.py
```

FastAPI: **http://127.0.0.1:8100**. Swagger docs: **http://127.0.0.1:8100/docs**.

**Terminal 2**, from Lesson 0:

```powershell
cd .\05-smallest-agent-vue-fastapi
npm run dev
```

Open **http://127.0.0.1:4600**. Keep both terminals running; Ctrl+C stops each process.

The root package.json forwards npm commands to frontend, so npm run dev also works directly from 05-smallest-agent-vue-fastapi. Running it inside frontend remains supported. Install frontend dependencies with npm --prefix frontend ci; the root launcher has no dependencies of its own. FastAPI still runs in the separate terminal above.

Vue calls relative `/api` endpoints. Vite forwards `/api`, `/docs` and `/openapi.json` to port 8100 while preserving the browser Host. The backend checks actual Origin, scheme, host and port rather than assuming localhost and 127.0.0.1 are the same browser origin. There is no wildcard CORS policy or need to edit an API URL in the UI.

The backend launcher deliberately avoids Uvicorn reload and uses a Windows Proactor event loop, allowing the SDK to start its CLI subprocess. Restart Python after backend edits. Vite provides frontend hot reload.

## Built application: one Python server

From the new application's root:

```powershell
cd frontend
npm run build
cd ..
.\.venv\Scripts\python.exe backend/run.py
```

Stop an existing FastAPI instance first. At startup, FastAPI detects `frontend/dist` and serves Vue at **http://127.0.0.1:8100** alongside the API. Restart after the first build. The frontend uses hash routing (`/#/architecture`, for example), so static hosting does not need a broad HTML fallback. Unknown API routes remain 404.

`npm run preview` is a static Vite preview and does not proxy the backend. Use the development server or FastAPI's built-application mode for working agent requests.

## Lesson sections and controls

- **Application lab:** Hello world! default, prompt examples, trim-aware counter, Stream/Simple modes, Ctrl+Enter, duplicate-submit lock, elapsed timer, answer/metrics, copy/download and expandable message JSON.
- **What you will learn:** the agent loop, Vue refs/computed, FastAPI validation, private configuration, safe message streaming and restricted tools.
- **How to run:** Windows setup, own backend `.env`, both terminals, tests and the one-server build mode.
- **Architecture & workflow:** five lifelines and 16 numbered UML arrows. Each arrow has a matching card with real source, colored code and an explanation. SVG and editable PlantUML are downloadable local assets.
- **Code walkthrough:** five generated excerpts covering input, HTTP, SDK iteration, result mapping and safe rendering.

Vue Router drives actual section navigation, and KeepAlive preserves the lab prompt/result while visiting the lesson views. Tests click every tab and verify updated content, active links, all 16 architecture cards and the preserved prompt. A separate test uses the production hash history. The skip link focuses the content without replacing the router hash.

Typography uses approximately 21 px body, 18 px code and at least 16 px secondary text, with spacious pastel blue/lilac/mint/peach cards. Dark theme persists locally. Native labels, keyboard controls, visible focus, responsive layouts, scrollable code/diagram regions and reduced-motion styles are included.

## API contract

| Endpoint | Behavior |
| --- | --- |
| GET /api/health | status plus api_key_configured; no secret |
| POST /api/agent/query | JSON prompt → normalized final result |
| POST /api/agent/stream | JSON prompt → SSE message/error/done |
| GET /docs | FastAPI's real Swagger UI |
| GET /openapi.json | Generated OpenAPI contract |

Send `{"prompt":"Hello world!"}` with `Content-Type: application/json`. Prompts must be 1–4000 characters after trimming; bodies are bounded to 32 KiB, including chunked requests. Wrong origin returns 403, oversized bodies 413, wrong content type 415, malformed JSON 400 and invalid prompts 422. Validation messages omit submitted values.

Missing keys return 503 in Simple mode or an SSE error in Stream mode, with no SDK invocation. Query failures return safe 502 responses. After SSE begins, failures emit error without done. A missing final ResultMessage or an early disconnect is an error; done never overrides is_error. Estimated cost is the SDK's result field, and null remains Not reported.

The Python SDK's message iterator is **not token streaming**. The inspector forwards allowlisted initialization/text/final metrics only; raw SDK data, environment, paths, sessions, thinking and tool arguments are excluded. Exact key occurrences are redacted. The visible timeline is capped at 500 rows without skipping final-result processing.

SDK options use `tools=[]`, `allowed_tools=[]`, `permission_mode='dontAsk'`, empty settings/skills/MCP and strict MCP configuration. Clearing allowed_tools alone is not a tool ban. The key is passed privately to the subprocess and remote Claude.ai MCP connections are disabled for the run. The async iterator closes on completion, early return, exception or cancellation. Work has a three-minute deadline; query disconnects cancel the running task, while native SSE handles stream disconnects and heartbeat framing.

Marked parses answers, Highlight.js colors selected languages (including Python and Vue/XML), and DOMPurify sanitizes all HTML before Vue v-html. The UI does not insert raw model text as HTML.

This is a local lesson application. Shared public hosting, user authentication/quotas and tool-enabled agents are separate extensions.

## Checks and teaching assets

From the new application root:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend
npm run generate:lesson
npm test
npm run build
```

Tests require no key or credits. Python tests replace only the SDK query boundary while exercising real FastAPI/Pydantic/native SSE and actual SDK message dataclasses. They cover validation, body limits, origins, normalized/safe messages, failures, missing result/key, iterator closure and cancellation. Vue tests use Vue Test Utils, real Vue Router and jsdom for navigation, both modes, errors/retry, state retention, busy controls, sanitization, theme and fetch/SSE parsing.

The Node generator reads source markers from this project, checks 16 diagram labels and writes `frontend/src/lesson/workflow.json` plus local SVG/PlantUML downloads. Missing markers fail rather than silently producing stale pseudocode. Regenerate after editing the illustrated source.

Frontend dependencies are exact and locked in package-lock.json. Python direct dependencies are exact in requirements.txt; requirements.lock.txt records the full **Windows/Python 3.14** environment used for verification. Use the direct requirements file on another platform so pip can resolve platform-specific wheels.

See `VERIFICATION.md` for actual outcomes and limits, `ASSETS.md` for provenance, and `BUILD-PROMPT.txt` for the identical copy of the new standalone Vue/FastAPI build prompt.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Python package missing | Use this edition's .venv interpreter and install backend/requirements.txt |
| PowerShell activation blocked | Use the explicit python.exe paths above; activation is unnecessary |
| Missing-key warning / 503 | Set this backend/.env, replace the placeholder and restart FastAPI |
| File value ignored | Check the launching process environment; it overrides the file |
| Backend root says Vue build missing | Use Vite on 4600, or build Vue and restart FastAPI |
| 403 Origin is not allowed | Keep browser Origin and Host aligned; retain changeOrigin:false in the Vite proxy |
| Browser cannot reach /api | Keep both dev terminals running, or use the built application on 8100 |
| Port occupied | Stop the earlier instance of this edition; do not stop other applications |
| SDK subprocess error on Windows | Use backend/run.py without reload; install Git for Windows if the CLI needs Git Bash |
| Custom Git Bash location | Set $env:CLAUDE_CODE_GIT_BASH_PATH in the launching PowerShell environment, then start FastAPI |
| Health online but model fails | Verify the key, selected model, credit and network; health checks presence only |
| Tabs show stale code after editing | Restart/reload; tests cover route changes and generated cards |
