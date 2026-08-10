<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import DestinationSearch from '../components/DestinationSearch.vue'
import { useNavigationStore } from '../stores/navigation'

const router = useRouter()
const navigation = useNavigationStore()

async function planRoute() {
  if (await navigation.loadRoutes()) router.push('/routes')
}

onMounted(() => {
  if (!navigation.origin) navigation.locateUser()
})
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
          <div>
            <small>{{
              navigation.originIsCurrentLocation ? 'Current location' : 'Starting point'
            }}</small
            ><strong>{{ navigation.originLabel }}</strong>
          </div>
        </div>
        <p v-if="navigation.locationError" class="location-error" role="alert">
          {{ navigation.locationError }}
          <button type="button" @click="navigation.locateUser">Try again</button>
        </p>
        <div class="crowd-summary">
          <p><strong>Route data</strong><span>Live and historical</span></p>
          <p><strong>Coverage</strong><span>Melbourne CBD</span></p>
        </div>
      </section>

      <section class="route-panel">
        <p class="eyebrow">Plan a calmer journey</p>
        <h2>Where would you like to go?</h2>
        <p>We’ll compare walking routes using crowd and sensory information.</p>

        <div class="field">
          <div class="field-head">
            <label class="field-label" for="origin">Starting point</label>
            <button
              v-if="!navigation.originIsCurrentLocation"
              class="link-button"
              type="button"
              @click="navigation.locateUser"
            >
              Use my location
            </button>
          </div>
          <!-- Only when the box is empty. Once a starting point is chosen the
               box itself shows it, and repeating it here reads as two fields. -->
          <p v-if="!navigation.originQuery" class="field-current">
            Starting from <strong>{{ navigation.originLabel }}</strong>
          </p>
          <DestinationSearch
            v-model="navigation.originQuery"
            input-id="origin"
            label="Search starting point"
            placeholder="Search starting point"
            :suggestions="navigation.originSuggestions"
            :loading="navigation.originSearchStatus === 'loading'"
            :error="navigation.originSearchError"
            @search="navigation.findOrigins"
            @select="navigation.chooseOrigin"
            @submit="planRoute"
          />
        </div>

        <div class="field">
          <label class="field-label" for="destination">Destination</label>
        </div>
        <DestinationSearch
          v-model="navigation.destination"
          :suggestions="navigation.suggestions"
          :loading="navigation.searchStatus === 'loading'"
          :error="navigation.searchError"
          @update:model-value="navigation.clearDestinationSelection"
          @search="navigation.findDestinations"
          @select="navigation.chooseDestination"
          @submit="planRoute"
        />
        <p v-if="navigation.routeError" class="form-error" role="alert">
          {{ navigation.routeError }}
        </p>
        <button
          class="primary-button full-width"
          type="button"
          :disabled="navigation.routeStatus === 'loading'"
          @click="planRoute"
        >
          {{ navigation.routeStatus === 'loading' ? 'Comparing routes…' : 'Find routes' }}
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-content {
  display: grid;
  width: min(1000px, calc(100% - 36px));
  min-height: calc(100vh - 76px);
  grid-template-columns: 0.9fr 1.1fr;
  gap: 80px;
  align-items: center;
  margin: 0 auto;
  padding: 60px 0;
}
.welcome-panel h1 {
  margin: 0 0 48px;
  font-size: clamp(2.8rem, 6vw, 5.4rem);
  line-height: 1;
  letter-spacing: -0.05em;
}
.location-block {
  display: flex;
  gap: 13px;
  align-items: center;
}
.location-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  color: var(--teal-700);
  background: var(--teal-100);
}
.location-block small {
  display: block;
  margin-bottom: 4px;
  color: var(--muted);
  font-style: italic;
}
.location-block strong {
  font-size: 1.18rem;
}
.location-error,
.form-error {
  color: #a43a32;
  font-size: 0.82rem;
  line-height: 1.4;
}
.location-error button,
.link-button {
  padding: 0;
  border: 0;
  color: var(--teal-700);
  background: transparent;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
}
.field {
  margin-bottom: 6px;
}
.field + .field {
  margin-top: 14px;
}
.field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.field-label {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.link-button {
  font-size: 0.74rem;
}
.field-current {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 0.8rem;
}
.field-current strong {
  color: var(--ink, inherit);
}
.crowd-summary {
  max-width: 360px;
  margin-top: 45px;
  padding: 22px 0;
  border-block: 1px solid var(--border);
}
.crowd-summary p {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}
.level {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.level i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #efb13c;
}
.route-panel {
  padding: clamp(28px, 5vw, 54px);
  border: 1px solid var(--border);
  border-radius: 28px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.route-panel h2 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  line-height: 1.12;
  letter-spacing: -0.035em;
}
.route-panel > p:not(.eyebrow) {
  margin: 17px 0 30px;
  color: var(--muted);
  line-height: 1.55;
}
.route-panel .primary-button {
  margin-top: 16px;
}
.primary-button:disabled {
  opacity: 0.6;
  cursor: wait;
}
@media (max-width: 720px) {
  .home-content {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 44px;
    padding: 42px 0;
  }
  .welcome-panel h1 {
    margin-bottom: 34px;
  }
  .crowd-summary {
    max-width: none;
    margin-top: 30px;
  }
  .route-panel {
    padding: 28px 20px;
  }
}
</style>
