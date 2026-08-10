<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import DestinationSearch from '../components/DestinationSearch.vue'
import RouteMap from '../components/RouteMap.vue'
import { useNavigationStore } from '../stores/navigation'

const router = useRouter()
const navigation = useNavigationStore()

function beginNavigation() {
  if (navigation.selectedRoute) router.push('/navigation')
}

async function chooseAndReload(result) {
  navigation.chooseDestination(result)
  await navigation.loadRoutes()
}

const freshness = computed(() => {
  if (!navigation.dataAsOf) return 'Score time unavailable'
  return `Scored ${new Date(navigation.dataAsOf).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
})
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

        <DestinationSearch
          v-model="navigation.destination"
          :suggestions="navigation.suggestions"
          :loading="navigation.searchStatus === 'loading'"
          :error="navigation.searchError"
          @update:model-value="navigation.clearDestinationSelection"
          @search="navigation.findDestinations"
          @select="chooseAndReload"
          @submit="navigation.loadRoutes"
        />

        <div v-if="navigation.routeStatus === 'loading'" class="state-panel" aria-live="polite">
          <span class="spinner"></span><strong>Comparing walking routes…</strong>
          <p>ORS is generating alternatives and we’re calculating sensory exposure.</p>
        </div>
        <div v-else-if="navigation.routeStatus === 'error'" class="state-panel error" role="alert">
          <strong>Routes could not be loaded</strong>
          <p>{{ navigation.routeError }}</p>
          <button class="secondary-button" type="button" @click="navigation.loadRoutes">
            Try again
          </button>
        </div>
        <div v-else-if="!navigation.routes.length" class="state-panel">
          <strong>No routes loaded</strong>
          <p>Choose a destination from the search results to compare routes.</p>
        </div>

        <template v-else>
          <p class="result-count">
            {{ navigation.routes.length }} routes found <span>· {{ freshness }}</span>
          </p>
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
                <strong>{{ route.label }}</strong
                ><small>{{ route.description }}</small>
              </span>
              <span class="route-time"
                ><strong>{{ route.duration }} min</strong
                ><small>{{ route.distance }} m</small></span
              >
              <span class="route-score" :class="{ partial: route.confidence === 'partial' }"
                >{{ route.stress ?? '—'
                }}<small>{{ route.confidence === 'partial' ? 'part. stress' : 'stress' }}</small></span
              >
              <span v-if="route.caution" class="route-caution">{{ route.caution }}</span>
              <span class="route-coverage">{{ route.coveragePct }}% sensory coverage</span>
            </button>
          </div>

          <div v-if="navigation.selectedRoute" class="selected-summary">
            <span
              ><AppIcon name="walk" :size="19" /> {{ navigation.selectedRoute.distance }} m</span
            >
            <span
              ><AppIcon name="clock" :size="19" /> {{ navigation.selectedRoute.duration }} min</span
            >
            <span>Crowd: {{ navigation.selectedRoute.crowd }}</span>
          </div>
          <button class="primary-button full-width" type="button" @click="beginNavigation">
            Take me there
          </button>
        </template>
      </section>

      <section class="map-panel">
        <RouteMap
          :routes="navigation.routes"
          :selected-route-id="navigation.selectedRouteId"
          @select="navigation.selectRoute"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.route-layout {
  display: grid;
  height: calc(100vh - 76px);
  grid-template-columns: minmax(360px, 440px) 1fr;
}
.route-controls {
  z-index: 2;
  overflow-y: auto;
  padding: 36px 32px 40px max(32px, calc((100vw - 1120px) / 2));
  background: white;
  box-shadow: 10px 0 35px rgba(22, 67, 64, 0.09);
}
h1 {
  margin: 0 0 26px;
  font-size: 2.1rem;
  letter-spacing: -0.04em;
}
.result-count {
  margin: 24px 0 12px;
  font-size: 0.87rem;
  font-weight: 750;
}
.result-count span {
  color: var(--muted);
  font-weight: 500;
}
.route-options {
  display: grid;
  gap: 9px;
}
.route-card {
  display: grid;
  grid-template-columns: 5px 1fr auto auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 15px;
  color: var(--ink);
  background: white;
  text-align: left;
  cursor: pointer;
}
.route-card.selected {
  border-color: var(--teal-600);
  background: var(--teal-100);
  box-shadow: 0 0 0 1px var(--teal-600);
}
.route-color {
  width: 5px;
  height: 43px;
  border-radius: 99px;
}
.route-card-main,
.route-time,
.route-score {
  display: flex;
  flex-direction: column;
}
.route-card small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.73rem;
}
.route-time {
  min-width: 54px;
}
.route-score {
  width: 45px;
  align-items: center;
  padding-left: 10px;
  border-left: 1px solid var(--border);
  font-size: 1.05rem;
}
/* A score measured over part of the route is still a real number, so it is
   shown — but it must not read as the same kind of statement as a fully
   measured one. The dashed rule is the cheapest honest signal. */
.route-score.partial {
  border-left-style: dashed;
  color: var(--muted);
}
.route-score.partial small {
  letter-spacing: -0.01em;
}
.route-caution,
.route-coverage {
  grid-column: 2 / -1;
  color: var(--muted);
  font-size: 0.72rem;
}
.route-caution {
  color: #9b493f;
}
.selected-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 20px 0;
  color: var(--muted);
  font-size: 0.86rem;
}
.selected-summary span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}
.map-panel {
  min-width: 0;
}
.state-panel {
  display: grid;
  justify-items: start;
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: var(--surface);
}
.state-panel p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.45;
}
.state-panel.error {
  border-color: #edc6c2;
  background: #fff7f6;
}
.state-panel .secondary-button {
  min-height: 40px;
  margin-top: 14px;
  padding-inline: 18px;
}
.spinner {
  width: 23px;
  height: 23px;
  margin-bottom: 12px;
  border: 3px solid var(--border);
  border-top-color: var(--teal-700);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 780px) {
  .route-layout {
    height: auto;
    grid-template-columns: 1fr;
  }
  .route-controls {
    overflow: visible;
    padding: 28px 16px 24px;
    box-shadow: none;
  }
  .map-panel {
    order: -1;
    height: 42vh;
    min-height: 320px;
  }
  h1 {
    font-size: 1.8rem;
  }
}
</style>
