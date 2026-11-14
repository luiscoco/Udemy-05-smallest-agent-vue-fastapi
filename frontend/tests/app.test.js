import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '../src/App.vue';
import CodeBlock from '../src/CodeBlock.vue';
import { makeRouter } from '../src/router.js';
import { renderMarkdown } from '../src/code.js';

const result = { result: '**Hello!**', num_turns: 1, duration_ms: 42, total_cost_usd: 0.001, is_error: false };
let wrapper;
beforeEach(() => { localStorage.clear(); document.documentElement.className = ''; });
afterEach(() => { wrapper?.unmount(); wrapper = null; window.history.replaceState({}, '', '/'); });
async function open(overrides = {}, path = '/') {
  const client = {
    health: vi.fn().mockResolvedValue({ status: 'ok', api_key_configured: true }),
    query: vi.fn().mockResolvedValue(result),
    stream: vi.fn(async (prompt, onMessage) => {
      onMessage({ type: 'SystemMessage', summary: 'Initialized', data: {} });
      onMessage({ type: 'ResultMessage', summary: 'Complete', data: result });
    }), ...overrides,
  };
  const router = makeRouter(createMemoryHistory()); await router.push(path); await router.isReady();
  wrapper = mount(App, { props: { client }, global: { plugins: [router] } }); await flushPromises();
  return { client, router };
}
describe('Vue lesson application', () => {
  it('clicks every tab, changes active content and returns to the preserved lab', async () => {
    await open(); await wrapper.get('textarea').setValue('Keep my prompt');
    for (const [path, heading] of [['/learn','Small enough to understand.'],['/setup','Two terminals.'],['/architecture','See how the pieces connect.'],['/walkthrough','The same loop. A Vue way'],['/','Start small. See everything.']]) {
      await wrapper.get(`.lesson-nav a[href="${path}"]`).trigger('click'); await flushPromises();
      expect(wrapper.text()).toContain(heading);
      expect(wrapper.findAll('.lesson-nav [aria-current="page"]')).toHaveLength(1);
      expect(wrapper.get('.lesson-nav [aria-current="page"]').attributes('href')).toBe(path);
      if (path === '/architecture') {
        const cards = wrapper.findAll('.workflow-code-step'); expect(cards).toHaveLength(16);
        cards.forEach((card,index) => { expect(card.attributes('id')).toBe(`uml-step-${index+1}`); expect(card.find('pre code').exists()).toBe(true); expect(card.find('.workflow-code-explanation').exists()).toBe(true); });
      }
    }
    expect(wrapper.get('textarea').element.value).toBe('Keep my prompt');
  });
  it('renders direct lesson routes and updates when revisiting a section', async () => {
    const { router } = await open({}, '/architecture'); expect(wrapper.findAll('.workflow-code-step')).toHaveLength(16);
    await router.push('/setup'); await flushPromises(); expect(wrapper.text()).toContain('backend/.env'); expect(wrapper.text()).toContain('8100'); expect(wrapper.text()).toContain('4600');
    await router.push('/walkthrough'); await flushPromises(); expect(wrapper.findAll('.lesson-step')).toHaveLength(5);
    await router.push('/architecture'); await flushPromises(); expect(wrapper.findAll('.workflow-code-step')).toHaveLength(16);
  });
  it('uses production hash links to change visible content', async () => {
    window.history.replaceState({}, '', '/#/');
    const router = makeRouter(); await router.push('/'); await router.isReady();
    const client = {health:vi.fn().mockResolvedValue({status:'ok',api_key_configured:false})};
    wrapper = mount(App,{props:{client},global:{plugins:[router]}}); await flushPromises();
    await wrapper.findAll('.lesson-nav a')[3].trigger('click'); await flushPromises();
    expect(window.location.hash).toBe('#/architecture'); expect(wrapper.findAll('.workflow-code-step')).toHaveLength(16);
    await wrapper.findAll('.lesson-nav a')[2].trigger('click'); await flushPromises();
    expect(window.location.hash).toBe('#/setup'); expect(wrapper.text()).toContain('Two terminals.');
  });
  it('keeps the current route when using the skip link', async () => {
    const {router}=await open({},'/learn'); await wrapper.get('.skip-link').trigger('click'); await flushPromises();
    expect(router.currentRoute.value.name).toBe('learn'); expect(wrapper.get('#lesson-content').attributes('tabindex')).toBe('-1');
  });
  it('streams timeline messages and renders a sanitized final answer', async () => {
    const { client } = await open(); await wrapper.get('.run-toolbar .primary').trigger('click'); await flushPromises();
    expect(client.stream).toHaveBeenCalledWith('Hello world!', expect.any(Function), expect.any(AbortSignal));
    expect(wrapper.findAll('.timeline-row')).toHaveLength(2); expect(wrapper.get('.markdown strong').text()).toBe('Hello!');
    expect(wrapper.get('.state').attributes('data-state')).toBe('success');
    expect(wrapper.text()).toContain('$0.001000');
  });
  it('supports Simple mode, prompt trimming and keyboard submission', async () => {
    const { client } = await open(); await wrapper.get('textarea').setValue('  Hi Vue  ');
    await wrapper.findAll('.mode-toggle button')[1].trigger('click'); await wrapper.get('textarea').trigger('keydown',{key:'Enter',ctrlKey:true}); await flushPromises();
    expect(client.query).toHaveBeenCalledWith('Hi Vue', expect.any(AbortSignal)); expect(client.stream).not.toHaveBeenCalled();
    expect(wrapper.get('.state').text()).toBe('success'); expect(wrapper.findAll('.timeline-row')).toHaveLength(0);
  });
  it('blocks blank input, duplicates and locks controls while waiting', async () => {
    let finish;
    const { client } = await open({ query: vi.fn(() => new Promise(resolve => { finish = resolve; })) });
    await wrapper.get('textarea').setValue('  '); expect(wrapper.get('.run-toolbar .primary').attributes()).toHaveProperty('disabled');
    await wrapper.get('textarea').setValue('Hello'); await wrapper.findAll('.mode-toggle button')[1].trigger('click');
    await wrapper.get('.run-toolbar .primary').trigger('click'); await wrapper.get('textarea').trigger('keydown',{key:'Enter',ctrlKey:true});
    expect(client.query).toHaveBeenCalledTimes(1); expect(wrapper.get('textarea').attributes()).toHaveProperty('disabled');
    finish(result); await flushPromises(); expect(wrapper.get('textarea').attributes()).not.toHaveProperty('disabled');
  });
  it('shows specific errors and allows retry', async () => {
    const stream = vi.fn().mockRejectedValueOnce(new Error('Origin is not allowed.')).mockImplementationOnce(async (_, emit) => emit({type:'ResultMessage',summary:'Complete',data:result}));
    await open({stream}); await wrapper.get('.run-toolbar .primary').trigger('click'); await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('Origin is not allowed.'); expect(wrapper.get('.snackbar').text()).toContain('Origin is not allowed.');
    await wrapper.get('.run-toolbar .primary').trigger('click'); await flushPromises(); expect(wrapper.find('[role="alert"]').exists()).toBe(false); expect(wrapper.get('.state').text()).toBe('success');
  });
  it('respects an error result even after successful transport', async () => {
    await open({query:vi.fn().mockResolvedValue({...result,is_error:true})}); await wrapper.findAll('.mode-toggle button')[1].trigger('click');
    await wrapper.get('.run-toolbar .primary').trigger('click'); await flushPromises(); expect(wrapper.get('.state').text()).toBe('error');
  });
  it('persists theme and reports missing server credentials', async () => {
    await open({health:vi.fn().mockResolvedValue({status:'ok',api_key_configured:false})});
    expect(wrapper.text()).toContain('API key needed'); await wrapper.get('[aria-label="Toggle light or dark theme"]').trigger('click');
    expect(document.documentElement.classList.contains('dark')).toBe(true); expect(localStorage.getItem('agent-theme')).toBe('dark');
  });
  it('aborts a pending SDK request when the application unmounts', async () => {
    let signal;
    await open({stream:vi.fn((_,__,abortSignal)=>{signal=abortSignal;return new Promise(()=>{});})});
    await wrapper.get('.run-toolbar .primary').trigger('click'); wrapper.unmount(); wrapper=null; expect(signal.aborted).toBe(true);
  });
  it('highlights Python code and removes unsafe model HTML', () => {
    wrapper = mount(CodeBlock,{props:{code:'async for message in query():\n    print("<script>")',language:'python'}});
    expect(wrapper.html()).toContain('hljs-keyword'); expect(wrapper.find('script').exists()).toBe(false);
    const safe=renderMarkdown('[bad](javascript:alert%281%29)\n\n<img src=x onerror="alert(1)">\n\n```python\nprint("hi")\n```');
    expect(safe).not.toContain('href="javascript:'); expect(safe).not.toContain('onerror='); expect(safe).toContain('hljs');
  });
});
