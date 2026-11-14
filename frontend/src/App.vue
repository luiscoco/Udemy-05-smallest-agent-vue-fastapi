<script setup>
import { onMounted, onUnmounted, provide, ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { api, CLIENT } from './api.js';
import { sections } from './router.js';
const props = defineProps({ client: { type: Object, default: () => api } });
provide(CLIENT, props.client);
const health = ref(null), checked = ref(false), dark = ref(false);
const controller = new AbortController();
function applyTheme() { document.documentElement.classList.toggle('dark', dark.value); }
function toggleTheme() {
  dark.value = !dark.value; applyTheme();
  try { localStorage.setItem('agent-theme', dark.value ? 'dark' : 'light'); } catch { /* Storage may be unavailable. */ }
}
function focusLesson() {
  const content = document.getElementById('lesson-content');
  content?.focus(); content?.scrollIntoView?.({ block: 'start' });
}
onMounted(async () => {
  try { dark.value = localStorage.getItem('agent-theme') === 'dark'; } catch { }
  applyTheme();
  try { health.value = await props.client.health(controller.signal); } catch { health.value = null; }
  finally { checked.value = true; }
});
onUnmounted(() => controller.abort());
</script>
<template>
  <a class="skip-link" href="#lesson-content" @click.prevent="focusLesson">Skip to lesson</a>
  <header class="topbar"><RouterLink class="brand" to="/"><span class="brand-icon">✦</span><span>The Smallest Agent<small>LESSON 0 · VUE 3 + FASTAPI</small></span></RouterLink><div class="header-actions"><span class="health"><i :class="{ online: health }"></i>{{ health ? 'Server online' : checked ? 'Server offline' : 'Checking server' }}</span><span v-if="health && !health.api_key_configured" class="warning">API key needed</span><a href="/docs" target="_blank" rel="noopener noreferrer">API docs ↗</a><button aria-label="Toggle light or dark theme" @click="toggleTheme">◐ {{ dark ? 'Light' : 'Dark' }} mode</button></div></header>
  <main>
    <section class="course-hero"><div><span class="eyebrow">ONE PROMPT. ONE LOOP. YOUR FIRST AGENT.</span><h1>The smallest agent.<br /><em>A whole new stack.</em></h1><p class="hero-lead">Start with “Hello world!” and follow your prompt all the way to Claude. Learn the Python loop and the Vue interface around it.</p><div class="hero-tags"><span>Vue 3 Composition API</span><span>FastAPI / Python</span><span>Claude Agent SDK</span><span>No tools · one turn</span></div></div><figure class="mascot"><img src="/astronaut.png" width="240" height="240" alt="Friendly course astronaut ready for a first agent adventure" /><figcaption>A small first step.<br />A foundation you can build on.</figcaption></figure></section>
    <nav class="lesson-nav" aria-label="Lesson sections"><RouterLink v-for="section in sections" :key="section.name" :to="section.path">{{ section.title }}</RouterLink></nav>
    <div id="lesson-content" tabindex="-1"><RouterView v-slot="{ Component }"><KeepAlive><component :is="Component" /></KeepAlive></RouterView></div>
    <footer>LESSON 0 · The Smallest Agent · Vue 3 + FastAPI · <RouterLink to="/setup">Setup guide</RouterLink></footer>
  </main>
</template>
