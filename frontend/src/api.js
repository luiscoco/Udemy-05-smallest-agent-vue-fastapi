export const CLIENT = Symbol('agent-client');
export function isAgentResult(value) {
  return value && typeof value.result === 'string' && Number.isInteger(value.num_turns) && Number.isFinite(value.duration_ms)
    && (value.total_cost_usd === null || Number.isFinite(value.total_cost_usd)) && typeof value.is_error === 'boolean';
}
const detail = (value, fallback) => typeof value?.detail === 'string' ? value.detail : fallback;
export async function readEvents(body, onEvent) {
  const reader = body.getReader(), decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, '\n');
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        let event = 'message'; const data = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
        }
        if (data.length) onEvent(event, JSON.parse(data.join('\n')));
      }
      if (done) break;
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
async function jsonRequest(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(detail(data, `Request failed (HTTP ${response.status}).`));
  return data;
}
function messageFrom(value) {
  if (!value || !['SystemMessage','AssistantMessage','UserMessage','ResultMessage','OtherMessage'].includes(value.type)
    || typeof value.summary !== 'string' || !value.data || typeof value.data !== 'object') throw new Error('The API returned an invalid message.');
  if (value.type === 'ResultMessage' && !isAgentResult(value.data)) throw new Error('The API returned an invalid final result.');
  return value;
}
export const api = {
  async health(signal) {
    const data = await jsonRequest('/api/health', { signal });
    if (data?.status !== 'ok' || typeof data.api_key_configured !== 'boolean') throw new Error('Invalid health response.');
    return data;
  },
  async query(prompt, signal) {
    const data = await jsonRequest('/api/agent/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal });
    if (!isAgentResult(data)) throw new Error('The API returned an invalid result.');
    return data;
  },
  async stream(prompt, onMessage, signal) {
    const response = await fetch('/api/agent/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal });
    if (!response.ok) throw new Error(detail(await response.json().catch(() => null), `The stream could not start (HTTP ${response.status}).`));
    if (!response.body) throw new Error('The server returned an empty stream.');
    let completed = false, finalReceived = false;
    await readEvents(response.body, (event, data) => {
      if (event === 'error') throw new Error(detail(data, 'The agent could not finish.'));
      if (event === 'message') {
        const message = messageFrom(data);
        if (message.type === 'ResultMessage') finalReceived = true;
        onMessage(message);
      }
      if (event === 'done') completed = true;
    });
    if (!completed || !finalReceived) throw new Error('The connection ended before the agent finished. Please try again.');
  },
};
