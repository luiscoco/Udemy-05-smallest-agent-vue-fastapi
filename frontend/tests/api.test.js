import { describe, expect, it, vi } from 'vitest';
import { api, readEvents } from '../src/api.js';
const result={result:'Hello',num_turns:1,duration_ms:42,total_cost_usd:null,is_error:false};
describe('Vue fetch/SSE client',()=>{
  it('preserves Unicode and CRLF across single-byte chunks',async()=>{
    const bytes=new TextEncoder().encode(': heartbeat\r\n\r\nevent: message\r\ndata: {"text":"héllo 🌍"}\r\n\r\nevent: done\ndata: {}\n\n');
    const body=new ReadableStream({start(c){for(const byte of bytes)c.enqueue(new Uint8Array([byte]));c.close();}});
    const events=[];await readEvents(body,(event,data)=>events.push([event,data]));expect(events).toEqual([['message',{text:'héllo 🌍'}],['done',{}]]);
  });
  it('propagates stream HTTP details and non-JSON status fallback',async()=>{
    const mock=vi.spyOn(globalThis,'fetch');mock.mockResolvedValueOnce(new Response('{"detail":"Origin is not allowed."}',{status:403}));
    await expect(api.stream('Hello',()=>{})).rejects.toThrow('Origin is not allowed.');
    mock.mockResolvedValueOnce(new Response('Bad gateway',{status:502}));await expect(api.stream('Hello',()=>{})).rejects.toThrow('HTTP 502');
  });
  it('requires final result and done, and handles SSE error',async()=>{
    const mock=vi.spyOn(globalThis,'fetch');
    for(const text of ['event: done\ndata: {}\n\n',`event: message\ndata: ${JSON.stringify({type:'ResultMessage',summary:'Done',data:result})}\n\n`]){
      mock.mockResolvedValueOnce(new Response(text));await expect(api.stream('Hi',()=>{})).rejects.toThrow('before the agent finished');
    }
    mock.mockResolvedValueOnce(new Response('event: error\ndata: {"detail":"Configure your key"}\n\n'));await expect(api.stream('Hi',()=>{})).rejects.toThrow('Configure your key');
  });
  it('validates final fields and posts JSON to the relative endpoint',async()=>{
    const mock=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify(result)));
    await expect(api.query('Hello')).resolves.toEqual(result);expect(mock.mock.calls[0][0]).toBe('/api/agent/query');expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual({prompt:'Hello'});
    mock.mockResolvedValueOnce(new Response('{"result":7}'));await expect(api.query('Hi')).rejects.toThrow('invalid result');
  });
});
