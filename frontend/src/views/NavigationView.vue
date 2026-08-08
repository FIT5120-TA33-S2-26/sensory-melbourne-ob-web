<script setup>
import { ref } from 'vue'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import RouteMap from '../components/RouteMap.vue'
import { useNavigationStore } from '../stores/navigation'

const navigation = useNavigationStore()
const showMap = ref(false)
</script>

<template>
  <div class="screen">
    <AppHeader />
    <main v-if="navigation.selectedRoute" class="navigation-layout">
      <section class="navigation-copy">
        <p class="eyebrow">Navigation active</p>
        <h1>{{ navigation.destination }}</h1>
        <div class="status-strip">
          <span
            >Selected route: <strong>{{ navigation.selectedRoute.label }}</strong></span
          >
          <span
            >Current crowd: <strong>{{ navigation.selectedRoute.crowd }}</strong></span
          >
        </div>

        <article v-if="navigation.instructions.length" class="next-instruction">
          <span class="instruction-icon"><AppIcon name="arrow" :size="32" /></span>
          <div>
            <small>Next instruction</small>
            <h2>{{ navigation.instructions[0].text }}</h2>
            <p>{{ navigation.instructions[0].distance }} to next turn</p>
          </div>
        </article>
        <p v-else class="instruction-unavailable">
          Written instructions are unavailable for this route.
        </p>

        <div class="journey-stats">
          <div>
            <small>Remaining</small><strong>{{ navigation.selectedRoute.distance }} m</strong
            ><span>{{ navigation.selectedRoute.duration }} min</span>
          </div>
          <div>
            <small>Sensory score</small
            ><strong
              >{{ navigation.selectedRoute.stress ?? 'Unknown'
              }}<template v-if="navigation.selectedRoute.stress !== null"> / 100</template></strong
            ><span>{{ navigation.selectedRoute.coveragePct }}% coverage</span>
          </div>
        </div>

        <ol class="instructions">
          <li
            v-for="(step, index) in navigation.instructions"
            :key="`${index}-${step.text}`"
            :class="{ current: index === 0 }"
          >
            <span :style="{ background: step.color }">{{ index + 1 }}</span>
            <p>
              {{ step.text
              }}<small
                >{{ step.distance
                }}<em v-if="step.stress !== null">{{ step.stress }} stress</em></small
              >
            </p>
          </li>
        </ol>
        <button class="secondary-button map-toggle" type="button" @click="showMap = !showMap">
          {{ showMap ? 'Hide map' : 'Switch to map view' }}
        </button>
      </section>

      <section class="active-map" :class="{ visible: showMap }">
        <RouteMap
          :routes="[navigation.selectedRoute]"
          :selected-route-id="navigation.selectedRouteId"
        />
      </section>
    </main>
    <main v-else class="missing-route">
      <p class="eyebrow">Navigation unavailable</p>
      <h1>Choose a route first</h1>
      <p>Return to route planning and select a destination before starting navigation.</p>
      <RouterLink class="primary-button" to="/home">Plan a route</RouterLink>
    </main>
  </div>
</template>

<style scoped>
.navigation-layout {
  display: grid;
  height: calc(100vh - 76px);
  grid-template-columns: minmax(400px, 500px) 1fr;
}
.navigation-copy {
  overflow-y: auto;
  padding: 40px 38px 60px max(38px, calc((100vw - 1120px) / 2));
  background: white;
}
h1 {
  max-width: 400px;
  margin: 0 0 22px;
  font-size: 2.25rem;
  line-height: 1.08;
  letter-spacing: -0.04em;
}
.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  color: var(--muted);
  font-size: 0.85rem;
}
.next-instruction {
  display: flex;
  gap: 18px;
  margin: 38px 0 26px;
  padding: 24px;
  border-radius: 20px;
  color: white;
  background: var(--teal-700);
  box-shadow: var(--shadow);
}
.instruction-icon {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}
.next-instruction small {
  opacity: 0.76;
}
.next-instruction h2 {
  margin: 4px 0 8px;
  font-size: 1.25rem;
  line-height: 1.25;
}
.next-instruction p {
  margin: 0;
  opacity: 0.85;
}
.journey-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.journey-stats > div {
  display: flex;
  flex-direction: column;
  padding: 17px;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: var(--surface);
}
.journey-stats small {
  color: var(--muted);
}
.journey-stats strong {
  margin: 5px 0 2px;
  font-size: 1.22rem;
}
.journey-stats span {
  color: var(--muted);
  font-size: 0.78rem;
}
.instructions {
  margin: 32px 0;
  padding: 0;
  list-style: none;
}
.instructions li {
  display: flex;
  gap: 15px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
}
.instructions li > span {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #e8efed;
  font-size: 0.75rem;
  font-weight: 800;
}
.instructions li.current {
  color: var(--ink);
  font-weight: 700;
}
.instructions li.current > span {
  color: white;
  background: var(--teal-600);
}
.instructions p {
  display: flex;
  flex: 1;
  justify-content: space-between;
  gap: 12px;
  margin: 3px 0 0;
}
.instructions small {
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}
.instructions small em {
  display: block;
  margin-top: 3px;
  font-size: 0.68rem;
  font-style: normal;
}
.map-toggle {
  width: 100%;
}
.active-map {
  min-width: 0;
}
.missing-route {
  width: min(520px, calc(100% - 32px));
  margin: 0 auto;
  padding: 90px 0;
  text-align: center;
}
.missing-route h1 {
  max-width: none;
}
@media (min-width: 781px) {
  .map-toggle {
    display: none;
  }
}
@media (max-width: 780px) {
  .navigation-layout {
    display: block;
    height: auto;
  }
  .navigation-copy {
    overflow: visible;
    padding: 30px 16px 50px;
  }
  .active-map {
    display: none;
    height: 55vh;
    min-height: 390px;
  }
  .active-map.visible {
    display: block;
  }
  h1 {
    font-size: 1.9rem;
  }
}
</style>
