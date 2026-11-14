import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = { lab: 'frontend/src/Lab.vue', client: 'frontend/src/api.js', service: 'backend/app/agent_service.py', api: 'backend/app/main.py', code: 'frontend/src/code.js' };
const sources = Object.fromEntries(Object.entries(files).map(([name, path]) => [name, readFileSync(resolve(root, path), 'utf8')]));
function excerpt(key, marker, count = 5) {
  const lines = sources[key].split(/\r?\n/), index = lines.findIndex(line => line.includes(marker));
  if (index < 0) throw new Error(`Missing source marker: ${files[key]} ${marker}`);
  const selected = lines.slice(index, index + count);
  const indent = Math.min(...selected.filter(line => line.trim()).map(line => line.search(/\S/)));
  return selected.map(line => line.slice(indent)).join('\n').trimEnd();
}
const svg = readFileSync(resolve(root, 'scripts/workflow-template.svg'), 'utf8');
const labels = [...svg.matchAll(/<text[^>]*>(\d+)\. ([^<]+)<\/text>/g)].map(match => [Number(match[1]), match[2].replaceAll('&amp;','&').replaceAll('&gt;','>')]);
if (labels.length !== 16) throw new Error('Expected 16 diagram labels');
const steps = [];
function step(number, key, marker, count, text, explanation, language) {
  const title = labels.find(([index]) => index === number)?.[1];
  if (!title) throw new Error(`Missing UML step ${number}`);
  steps.push({ number, title, source: files[key], language: language || (['api','service'].includes(key) ? 'python' : 'javascript'), text, code: excerpt(key, marker, count), explanation });
}
step(1,'lab','async function run()',5,'The Vue component trims the prompt and blocks duplicate or invalid submissions.','refs store request state; computed values derive validity and safe presentation. The API repeats validation independently.');
step(2,'client',"const response = await fetch('/api/agent/stream'",4,'The browser posts a JSON prompt and consumes the same-origin response stream.','Vite preserves the browser Host when forwarding /api during development. Production serves Vue and the API from the same FastAPI server.');
step(3,'service','return ClaudeAgentOptions(',9,'The service disables built-in tools and isolates settings, skills and MCP.','tools=[] is the tool ban; allowed_tools=[] only controls automatic approvals. The endpoint separately validates the bounded JSON body and trimmed prompt.');
step(4,'service','source = self.query_fn(',6,'The recognizable query() → async for → ResultMessage loop remains on the server.','This selected run_agent excerpt returns the final answer. The streaming function consumes the same SDK boundary and projects each intermediate message. aclosing releases the iterator on return, error or cancellation.');
step(5,'service','model=self.settings.claude_model',5,'The SDK receives private model, system-prompt and authentication configuration.','This options excerpt represents the SDK/provider boundary. The SDK owns the CLI runtime and model transport; the application does not invent a second HTTP call to Claude.');
step(6,'service','async for message in source:',3,'The SDK yields message objects while managing inference and lifecycle events.','The model-to-SDK arrow is observed through this iterator. Messages may arrive at different points in inference; they are not token-level deltas.');
step(7,'service',"yield {'type': kind",3,'Only explicit public fields are forwarded to the API.','The branches above this yield allowlist text, system subtype and final metrics. Thinking, raw SDK objects, paths, environment and tool arguments are excluded.');
step(8,'api','async with aclosing(agent.stream_agent',5,'Native FastAPI SSE encodes each projected message and then the terminal event.','Yield ServerSentEvent objects directly. The framework owns framing, flushing, heartbeat and disconnect handling; do not double-encode its JSON data.');
step(9,'lab','else await client.stream(',5,'Each parsed message appends a timestamped timeline entry to Vue state.','The UI caps visible rows at 500 while continuing to process the final result. Vue renders the inspector from reactive state rather than manual DOM writes.');
step(10,'service','def result_data(',9,'Normalize the SDK final answer, turns, duration, estimated cost and error flag.','A non-success subtype remains an error even if is_error was false. Exact credential occurrences are redacted, and an absent cost stays null rather than being invented.');
step(11,'client',"if (event === 'message')",6,'Runtime-check the public message and final result before dispatching to Vue.','The final ResultMessage travels in the same message event as progress. The component independently validates the final fields before updating the answer.');
step(12,'code','const markdown = new Marked',3,'Markdown fenced code uses language-aware highlighting and all output is sanitized.','Only the sanitized computed answer reaches Vue v-html. Highlighting escapes source before DOMPurify sanitizes the generated token markup.');
step(13,'client',"if (event === 'done')",4,'Require both final result and terminal done before resolving the stream.','The final result is authoritative for success. Transport completion does not override is_error, and an early disconnect stays a failure.');
step(14,'api','except Exception:',2,'Errors before a query response become safe 502 responses; streaming failures use SSE error with no done.','The query excerpt demonstrates the safe failure boundary. The stream function has its own catch yielding an error event after SSE begins; raw exception details are never returned.');
step(15,'lab','} catch (failure)',5,'Restore a readable error state and notification when the request fails.','Specific HTTP validation/origin errors survive the API client. Clipboard feedback also uses a visible notification. Timers and abort controllers are cleaned up.');
step(16,'api',"yield ServerSentEvent(event='error', data={'detail': MISSING_KEY})",2,'A missing key stops the stream before query() is called; invalid prompt bodies are rejected before SSE starts.','The corresponding query route returns 503. Pydantic rejects blank/oversized prompts with 422. None of these paths spends model credits.');
mkdirSync(resolve(root,'frontend/src/lesson'),{ recursive:true });
writeFileSync(resolve(root,'frontend/src/lesson/workflow.json'),JSON.stringify(steps,null,2)+'\n');
writeFileSync(resolve(root,'frontend/public/workflow.svg'),svg);
writeFileSync(resolve(root,'frontend/public/workflow.puml'),readFileSync(resolve(root,'scripts/workflow-template.puml')));
console.log('Generated 16 Vue/Python workflow cards with matching UML labels and local diagrams.');
