<script setup>
import { onMounted, ref } from 'vue'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import QuietSpacesMap from '../components/QuietSpacesMap.vue'
import { useQuietSpacesStore } from '../stores/quietSpaces'

const quietSpaces = useQuietSpacesStore()
const selectedPlaceId = ref(null)

const labels = { park: 'Park', library: 'Library', dock: 'Dock', pier: 'Pier' }

function formatDistance(distance) {
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`
}

onMounted(() => quietSpaces.load())
</script>

<template>
  <div class="screen quiet-screen">
    <AppHeader />
    <main class="quiet-layout">
      <section class="quiet-copy">
        <p class="eyebrow">Within 1.6 km of you</p>
        <h1>Nearby quiet spaces</h1>
        <p class="intro">Find parks, libraries, docks and piers near your current location.</p>

        <div
          v-if="quietSpaces.status === 'locating' || quietSpaces.status === 'loading'"
          class="state-panel"
          aria-live="polite"
        >
          <span class="spinner"></span>
          <strong>{{ quietSpaces.status === 'locating' ? 'Finding your location…' : 'Finding quiet spaces…' }}</strong>
        </div>

        <div v-else-if="quietSpaces.status === 'error'" class="state-panel error" role="alert">
          <strong>Quiet spaces could not be loaded</strong>
          <p>{{ quietSpaces.error }}</p>
          <button class="secondary-button" type="button" @click="quietSpaces.load">Try again</button>
        </div>

        <div v-else-if="quietSpaces.status === 'empty'" class="state-panel">
          <strong>No supported quiet spaces found</strong>
          <p>There are no mapped parks, libraries, docks or piers within 1.6 km.</p>
        </div>

        <template v-else-if="quietSpaces.status === 'success'">
          <p class="result-count">{{ quietSpaces.places.length }} places found</p>
          <ol class="place-list">
            <li v-for="place in quietSpaces.places" :key="place.id">
              <button
                type="button"
                :class="{ selected: selectedPlaceId === place.id }"
                @click="selectedPlaceId = place.id"
              >
                <span class="category-icon" :class="place.category">
                  <AppIcon :name="place.category === 'park' ? 'leaf' : place.category === 'library' ? 'book' : 'anchor'" :size="21" />
                </span>
                <span><strong>{{ place.name }}</strong><small>{{ labels[place.category] }}</small></span>
                <b>{{ formatDistance(place.distance) }}</b>
              </button>
            </li>
          </ol>
          <p class="data-note">Locations from {{ quietSpaces.attribution }}.</p>
        </template>
      </section>

      <section class="quiet-map-panel">
        <QuietSpacesMap
          :location="quietSpaces.location"
          :places="quietSpaces.places"
          :radius="quietSpaces.radius"
          :selected-place-id="selectedPlaceId"
          @select="selectedPlaceId = $event"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.quiet-layout { display: grid; min-height: calc(100vh - 76px); grid-template-columns: minmax(360px, 440px) 1fr; }
.quiet-copy { overflow-y: auto; padding: 38px 32px 52px max(32px, calc((100vw - 1120px) / 2)); background: white; box-shadow: 10px 0 35px rgba(22, 67, 64, .09); }
h1 { margin: 0 0 12px; font-size: 2.1rem; letter-spacing: -.04em; }
.intro { margin: 0 0 28px; color: var(--muted); line-height: 1.5; }
.result-count { margin: 0 0 12px; color: var(--muted); font-size: .85rem; font-weight: 750; }
.place-list { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
.place-list button { display: grid; width: 100%; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 13px; border: 1px solid var(--border); border-radius: 15px; color: var(--ink); background: white; text-align: left; cursor: pointer; }
.place-list button:hover, .place-list button.selected { border-color: var(--teal-600); background: var(--teal-100); }
.place-list button > span:nth-child(2) { display: flex; min-width: 0; flex-direction: column; }
.place-list strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.place-list small { margin-top: 3px; color: var(--muted); }
.place-list b { color: var(--teal-700); font-size: .85rem; white-space: nowrap; }
.category-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; color: white; }
.category-icon.park { background: #168f86; }
.category-icon.library { background: #5b6fe5; }
.category-icon.dock { background: #2878a8; }
.category-icon.pier { background: #ef8354; }
.data-note { margin: 22px 0 0; color: var(--muted); font-size: .75rem; line-height: 1.4; }
.state-panel { margin-top: 22px; padding: 22px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
.state-panel.error { border-color: #efb6af; background: #fff4f2; }
.spinner { display: inline-block; width: 17px; height: 17px; margin-right: 10px; border: 2px solid var(--border); border-top-color: var(--teal-700); border-radius: 50%; animation: spin .8s linear infinite; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }
.quiet-map-panel { min-width: 0; }
@media (max-width: 760px) {
  .quiet-layout { display: flex; min-height: auto; flex-direction: column; }
  .quiet-copy { overflow: visible; padding: 30px 20px 34px; box-shadow: none; }
  .quiet-map-panel { height: 58vh; min-height: 420px; }
}
</style>
