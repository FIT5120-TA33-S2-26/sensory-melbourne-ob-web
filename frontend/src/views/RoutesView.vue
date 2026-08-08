<script setup>
import { useRouter } from 'vue-router'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import DestinationSearch from '../components/DestinationSearch.vue'
import RouteMap from '../components/RouteMap.vue'
import { useNavigationStore } from '../stores/navigation'

const router = useRouter()
const navigation = useNavigationStore()

function beginNavigation() {
  router.push('/navigation')
}
</script>

<template>
  <div class="screen route-screen">
    <AppHeader />
    <main class="route-layout">
      <section class="route-controls">
        <div>
          <p class="eyebrow">Walking route</p>
          <h1>Choose your journey</h1>
        </div>

        <div class="field-row">
          <label for="crowd-level">Preferred crowd level</label>
          <select id="crowd-level"><option>Low</option><option>Medium</option><option>Any</option></select>
        </div>
        <DestinationSearch v-model="navigation.destination" />

        <p class="result-count">3 distinct routes found <span>· Demo route data</span></p>
        <div class="route-options" role="radiogroup" aria-label="Candidate routes">
          <button
            v-for="route in navigation.routes"
            :key="route.id"
            class="route-card"
            :class="{ selected: navigation.selectedRouteId === route.id }"
            type="button"
            role="radio"
            :aria-checked="navigation.selectedRouteId === route.id"
            @click="navigation.selectRoute(route.id)"
          >
            <span class="route-color" :style="{ background: route.color }"></span>
            <span class="route-card-main">
              <strong>{{ route.label }}</strong><small>{{ route.description }}</small>
            </span>
            <span class="route-time"><strong>{{ route.duration }} min</strong><small>{{ route.distance }} m</small></span>
            <span class="route-score">{{ route.stress }}<small>stress</small></span>
          </button>
        </div>

        <div class="selected-summary">
          <span><AppIcon name="walk" :size="19" /> {{ navigation.selectedRoute.distance }} m</span>
          <span><AppIcon name="clock" :size="19" /> {{ navigation.selectedRoute.duration }} min</span>
          <span>Crowd: {{ navigation.selectedRoute.crowd }}</span>
        </div>
        <button class="primary-button full-width" type="button" @click="beginNavigation">Take me there</button>
      </section>

      <section class="map-panel">
        <RouteMap :routes="navigation.routes" :selected-route-id="navigation.selectedRouteId" @select="navigation.selectRoute" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.route-layout { display: grid; height: calc(100vh - 76px); grid-template-columns: minmax(360px, 440px) 1fr; }
.route-controls { z-index: 2; overflow-y: auto; padding: 36px 32px 40px max(32px, calc((100vw - 1120px) / 2)); background: white; box-shadow: 10px 0 35px rgba(22, 67, 64, .09); }
h1 { margin: 0 0 26px; font-size: 2.1rem; letter-spacing: -.04em; }
.field-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
.field-row label { font-weight: 750; }
select { padding: 8px 28px 8px 12px; border: 1px solid var(--border); border-radius: 9px; color: var(--ink); background: white; }
.result-count { margin: 24px 0 12px; font-size: .87rem; font-weight: 750; }
.result-count span { color: var(--muted); font-weight: 500; }
.route-options { display: grid; gap: 9px; }
.route-card { display: grid; grid-template-columns: 5px 1fr auto auto; gap: 12px; align-items: center; width: 100%; padding: 14px; border: 1px solid var(--border); border-radius: 15px; color: var(--ink); background: white; text-align: left; cursor: pointer; }
.route-card.selected { border-color: var(--teal-600); background: var(--teal-100); box-shadow: 0 0 0 1px var(--teal-600); }
.route-color { width: 5px; height: 43px; border-radius: 99px; }
.route-card-main, .route-time, .route-score { display: flex; flex-direction: column; }
.route-card small { margin-top: 3px; color: var(--muted); font-size: .73rem; }
.route-time { min-width: 54px; }
.route-score { width: 45px; align-items: center; padding-left: 10px; border-left: 1px solid var(--border); font-size: 1.05rem; }
.selected-summary { display: flex; flex-wrap: wrap; gap: 10px 18px; margin: 20px 0; color: var(--muted); font-size: .86rem; }
.selected-summary span { display: inline-flex; gap: 5px; align-items: center; }
.map-panel { min-width: 0; }
@media (max-width: 780px) {
  .route-layout { height: auto; grid-template-columns: 1fr; }
  .route-controls { overflow: visible; padding: 28px 16px 24px; box-shadow: none; }
  .map-panel { order: -1; height: 42vh; min-height: 320px; }
  h1 { font-size: 1.8rem; }
}
</style>
