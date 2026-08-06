<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { getHealth } from './services/api'

const apiState = ref('checking')
const health = ref(null)
const errorMessage = ref('')
let requestController

const statusLabel = computed(() => {
  if (apiState.value === 'checking') return 'Checking connection…'
  if (apiState.value === 'connected') return 'Frontend and API connected'
  return 'Frontend running · API unavailable'
})

const checkedAt = computed(() => {
  if (!health.value?.data_as_of) return null
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(health.value.data_as_of))
})

async function checkApi() {
  requestController?.abort()
  requestController = new AbortController()
  apiState.value = 'checking'
  errorMessage.value = ''

  try {
    health.value = await getHealth(requestController.signal)
    apiState.value = health.value.status === 'ok' ? 'connected' : 'degraded'
  } catch (error) {
    if (error.name === 'AbortError') return
    apiState.value = 'disconnected'
    errorMessage.value = 'Start the Flask API on port 5000, then try again.'
  }
}

onMounted(checkApi)
onBeforeUnmount(() => requestController?.abort())
</script>

<template>
  <main class="page-shell">
    <nav class="nav" aria-label="Main navigation">
      <a class="brand" href="/" aria-label="Sensory Melbourne home">
        <span class="brand-mark" aria-hidden="true">S</span>
        <span>Sensory Melbourne</span>
      </a>
      <span class="prototype-tag">Connection test</span>
    </nav>

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Sensory-friendly urban wayfinding</p>
        <h1>A calmer way through Melbourne.</h1>
        <p class="intro">
          This first build confirms that the Vue interface can communicate with the Flask API.
          Route planning, live crowd data, and quiet spaces will be added next.
        </p>
      </div>

      <article class="status-card" :data-state="apiState" aria-live="polite">
        <div class="status-heading">
          <span class="status-dot" aria-hidden="true"></span>
          <div>
            <p class="status-kicker">Application status</p>
            <h2>{{ statusLabel }}</h2>
          </div>
        </div>

        <p v-if="apiState === 'checking'" class="status-detail">Calling <code>/api/health</code></p>
        <p v-else-if="apiState === 'connected'" class="status-detail">
          {{ health?.message }}<span v-if="checkedAt"> Checked {{ checkedAt }}.</span>
        </p>
        <p v-else class="status-detail">{{ errorMessage }}</p>

        <button type="button" :disabled="apiState === 'checking'" @click="checkApi">
          {{ apiState === 'checking' ? 'Checking…' : 'Check again' }}
        </button>
      </article>
    </section>

    <section class="next-up" aria-labelledby="next-up-title">
      <div>
        <p class="eyebrow">Foundation ready</p>
        <h2 id="next-up-title">What this build establishes</h2>
      </div>
      <ul>
        <li><span>01</span> Responsive Vue application shell</li>
        <li><span>02</span> Flask API connectivity check</li>
        <li><span>03</span> A clean base for the Figma design</li>
      </ul>
    </section>
  </main>
</template>

<style>
:root {
  color: #18352f;
  background: #f4f7f1;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; min-height: 100vh; }
button, code { font: inherit; }
button:focus-visible, a:focus-visible { outline: 3px solid #f1b75c; outline-offset: 3px; }

.page-shell { min-height: 100vh; overflow: hidden; }
.nav {
  display: flex; align-items: center; justify-content: space-between;
  width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 26px 0;
}
.brand { display: flex; gap: 12px; align-items: center; color: inherit; font-weight: 750; text-decoration: none; }
.brand-mark {
  display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px;
  color: white; background: #176b5b; font-family: Georgia, serif; font-size: 22px;
}
.prototype-tag { padding: 8px 12px; border: 1px solid #ccdbd1; border-radius: 999px; color: #49645e; font-size: 13px; }
.hero {
  display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr); gap: 72px;
  width: min(1120px, calc(100% - 40px)); margin: 90px auto 110px; align-items: center;
}
.eyebrow { margin: 0 0 15px; color: #176b5b; font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1 { max-width: 700px; margin: 0; color: #14352e; font-family: Georgia, "Times New Roman", serif; font-size: clamp(52px, 7vw, 88px); font-weight: 500; line-height: .98; letter-spacing: -.045em; }
.intro { max-width: 650px; margin: 30px 0 0; color: #536a64; font-size: 18px; line-height: 1.7; }
.status-card { padding: 30px; border: 1px solid #d9e3dc; border-radius: 24px; background: rgba(255,255,255,.82); box-shadow: 0 24px 70px rgba(35,65,56,.10); }
.status-heading { display: flex; gap: 16px; align-items: flex-start; }
.status-dot { width: 13px; height: 13px; margin-top: 7px; border-radius: 50%; background: #d49b3f; box-shadow: 0 0 0 6px #f8edd9; }
.status-card[data-state="connected"] .status-dot { background: #168b68; box-shadow: 0 0 0 6px #dff2e9; }
.status-card[data-state="disconnected"] .status-dot, .status-card[data-state="degraded"] .status-dot { background: #bf5b4c; box-shadow: 0 0 0 6px #f6e2de; }
.status-kicker { margin: 0 0 5px; color: #71857f; font-size: 13px; }
.status-card h2 { margin: 0; color: #18352f; font-size: 21px; line-height: 1.35; }
.status-detail { min-height: 52px; margin: 24px 0; color: #59706a; line-height: 1.6; }
code { padding: 3px 7px; border-radius: 5px; background: #edf2ee; color: #176b5b; font-size: 14px; }
button { width: 100%; padding: 13px 18px; border: 0; border-radius: 12px; color: white; background: #176b5b; font-weight: 750; cursor: pointer; }
button:hover:not(:disabled) { background: #11584b; }
button:disabled { cursor: wait; opacity: .55; }
.next-up { display: grid; grid-template-columns: 1fr 1.35fr; gap: 70px; padding: 70px max(20px, calc((100% - 1120px) / 2)); background: #e5eee7; }
.next-up h2 { max-width: 430px; margin: 0; font-family: Georgia, serif; font-size: clamp(32px, 4vw, 48px); font-weight: 500; line-height: 1.1; }
.next-up ul { margin: 0; padding: 0; list-style: none; }
.next-up li { display: flex; gap: 22px; padding: 20px 0; border-bottom: 1px solid #c8d8cd; font-size: 17px; }
.next-up li:first-child { padding-top: 0; }
.next-up li span { color: #176b5b; font-size: 13px; font-weight: 800; }

@media (max-width: 760px) {
  .prototype-tag { display: none; }
  .hero { grid-template-columns: 1fr; gap: 50px; margin: 60px auto 80px; }
  h1 { font-size: clamp(48px, 15vw, 70px); }
  .next-up { grid-template-columns: 1fr; gap: 50px; }
}

@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
</style>
