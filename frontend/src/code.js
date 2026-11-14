import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import powershell from 'highlight.js/lib/languages/powershell';
import bash from 'highlight.js/lib/languages/bash';
import ini from 'highlight.js/lib/languages/ini';
import json from 'highlight.js/lib/languages/json';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';

for (const [name, grammar] of Object.entries({ javascript, python, xml, powershell, bash, ini, json })) hljs.registerLanguage(name, grammar);
hljs.registerAliases('vue', { languageName: 'xml' });
export function highlightCode(code, language = 'javascript') {
  const html = hljs.getLanguage(language) ? hljs.highlight(code, { language, ignoreIllegals: true }).value : hljs.highlightAuto(code, []).value;
  return DOMPurify.sanitize(html);
}
const markdown = new Marked({ renderer: { code: ({ text, lang }) => `<pre><code class="hljs">${highlightCode(text, (lang || '').split(/\s+/)[0])}</code></pre>` } });
// Vue v-html is used only with this sanitized output, never raw model text.
export function renderMarkdown(text) { return DOMPurify.sanitize(markdown.parse(text, { async: false })); }
