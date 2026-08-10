<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  location: { type: Object, default: null },
  places: { type: Array, default: () => [] },
  radius: { type: Number, default: 1600 },
  selectedPlaceId: { type: [Number, String], default: null },
})
const emit = defineEmits(['select'])

const categoryColors = {
  park: '#168f86',
  library: '#5b6fe5',
  dock: '#2878a8',
  pier: '#ef8354',
}

const mapElement = ref(null)
let map
let placeLayer

function drawPlaces() {
  if (!map || !props.location) return
  placeLayer?.remove()
  placeLayer = L.featureGroup().addTo(map)

  const origin = [props.location.lat, props.location.lon]
  const searchArea = L.circle(origin, {
    radius: props.radius,
    color: '#168f86',
    weight: 2,
    opacity: 0.65,
    fillColor: '#2cb5aa',
    fillOpacity: 0.06,
  }).addTo(placeLayer)

  L.circleMarker(origin, {
    radius: 9,
    color: '#fff',
    weight: 3,
    fillColor: '#ef4d3e',
    fillOpacity: 1,
  })
    .addTo(placeLayer)
    .bindTooltip('Your current location')

  props.places.forEach((place) => {
    const selected = place.id === props.selectedPlaceId
    L.circleMarker([place.lat, place.lon], {
      radius: selected ? 11 : 8,
      color: '#fff',
      weight: selected ? 4 : 3,
      fillColor: categoryColors[place.category] ?? '#607172',
      fillOpacity: 1,
    })
      .addTo(placeLayer)
      .bindTooltip(`${place.name} · ${place.distance} m`)
      .on('click', () => emit('select', place.id))
  })

  map.fitBounds(searchArea.getBounds(), { padding: [22, 22] })
}

onMounted(() => {
  map = L.map(mapElement.value, { zoomControl: true }).setView([-37.8136, 144.9631], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  drawPlaces()
})

watch(
  () => [props.location, props.places, props.radius, props.selectedPlaceId],
  drawPlaces,
  { deep: true },
)

onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="mapElement" class="quiet-map" aria-label="Map of nearby quiet spaces"></div>
</template>

<style scoped>
.quiet-map {
  z-index: 0;
  width: 100%;
  height: 100%;
  min-height: 460px;
  background: #e8efed;
}
:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
</style>
