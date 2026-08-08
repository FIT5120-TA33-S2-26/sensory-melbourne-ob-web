<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import DestinationSearch from '../components/DestinationSearch.vue'
import { useNavigationStore } from '../stores/navigation'

const router = useRouter()
const navigation = useNavigationStore()
const destination = ref(navigation.destination)

function planRoute() {
  navigation.destination = destination.value || 'State Library of Victoria'
  router.push('/routes')
}
</script>

<template>
  <div class="screen">
    <AppHeader />
    <main class="home-content">
      <section class="welcome-panel">
        <p class="eyebrow">Good morning</p>
        <h1>Welcome!</h1>
        <div class="location-block">
          <span class="location-icon"><AppIcon name="location" :size="25" /></span>
          <div><small>Current location</small><strong>Melbourne Central</strong></div>
        </div>
        <div class="crowd-summary">
          <p><strong>Crowd level</strong><span class="level"><i></i>Medium</span></p>
          <p><strong>Last updated</strong><span>9:00 AM</span></p>
        </div>
      </section>

      <section class="route-panel">
        <p class="eyebrow">Plan a calmer journey</p>
        <h2>Where would you like to go?</h2>
        <p>We’ll compare walking routes using crowd and sensory information.</p>
        <DestinationSearch v-model="destination" @submit="planRoute" />
        <button class="primary-button full-width" type="button" @click="planRoute">Find routes</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-content { display: grid; width: min(1000px, calc(100% - 36px)); min-height: calc(100vh - 76px); grid-template-columns: .9fr 1.1fr; gap: 80px; align-items: center; margin: 0 auto; padding: 60px 0; }
.welcome-panel h1 { margin: 0 0 48px; font-size: clamp(2.8rem, 6vw, 5.4rem); line-height: 1; letter-spacing: -.05em; }
.location-block { display: flex; gap: 13px; align-items: center; }
.location-icon { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 50%; color: var(--teal-700); background: var(--teal-100); }
.location-block small { display: block; margin-bottom: 4px; color: var(--muted); font-style: italic; }
.location-block strong { font-size: 1.18rem; }
.crowd-summary { max-width: 360px; margin-top: 45px; padding: 22px 0; border-block: 1px solid var(--border); }
.crowd-summary p { display: flex; justify-content: space-between; margin: 8px 0; }
.level { display: inline-flex; gap: 8px; align-items: center; }
.level i { width: 9px; height: 9px; border-radius: 50%; background: #efb13c; }
.route-panel { padding: clamp(28px, 5vw, 54px); border: 1px solid var(--border); border-radius: 28px; background: var(--surface); box-shadow: var(--shadow); }
.route-panel h2 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.7rem); line-height: 1.12; letter-spacing: -.035em; }
.route-panel > p:not(.eyebrow) { margin: 17px 0 30px; color: var(--muted); line-height: 1.55; }
.route-panel .primary-button { margin-top: 16px; }
@media (max-width: 720px) {
  .home-content { min-height: auto; grid-template-columns: 1fr; gap: 44px; padding: 42px 0; }
  .welcome-panel h1 { margin-bottom: 34px; }
  .crowd-summary { max-width: none; margin-top: 30px; }
  .route-panel { padding: 28px 20px; }
}
</style>
