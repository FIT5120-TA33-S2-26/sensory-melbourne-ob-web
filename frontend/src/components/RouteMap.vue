<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  routes: { type: Array, required: true },
  selectedRouteId: { type: String, required: true },
})
const emit = defineEmits(['select'])

let map
let routeLayer
const mapElement = ref(null)

function drawRoutes() {
  if (!map) return
  routeLayer?.remove()
  routeLayer = L.featureGroup().addTo(map)

  const orderedRoutes = [...props.routes].sort((route) => (route.id === props.selectedRouteId ? 1 : -1))
  orderedRoutes.forEach((route) => {
    const selected = route.id === props.selectedRouteId
    L.polyline(route.geometry, {
      color: selected ? route.color : '#809190',
      weight: selected ? 8 : 5,
      opacity: selected ? 1 : 0.48,
      dashArray: selected ? undefined : '9 8',
    })
      .addTo(routeLayer)
      .bindTooltip(`${route.label}: ${route.duration} min`)
      .on('click', () => emit('select', route.id))
  })

  const selected = props.routes.find((route) => route.id === props.selectedRouteId) ?? props.routes[0]
  if (selected) {
    L.circleMarker(selected.geometry[0], { radius: 7, color: '#fff', weight: 3, fillColor: '#142526', fillOpacity: 1 }).addTo(routeLayer)
    L.circleMarker(selected.geometry.at(-1), { radius: 8, color: '#fff', weight: 3, fillColor: '#ef4d3e', fillOpacity: 1 }).addTo(routeLayer)
    map.fitBounds(L.latLngBounds(selected.geometry), { padding: [35, 35] })
  }
}

onMounted(() => {
  map = L.map(mapElement.value, { zoomControl: true }).setView([-37.809, 144.9645], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  drawRoutes()
})

watch(() => [props.routes, props.selectedRouteId], drawRoutes, { deep: true })
onBeforeUnmount(() => map?.remove())
</script>

<template><div ref="mapElement" class="route-map" aria-label="Map showing candidate walking routes"></div></template>

<style scoped>
.route-map { z-index: 0; width: 100%; height: 100%; min-height: 420px; background: #e8efed; }
:deep(.leaflet-control-attribution) { font-size: 10px; }
</style>
